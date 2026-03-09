import { prisma } from "#/db";
import { importSchema, scrapeExtractSchema } from "@/schemas/import";
import type { ScrapeExtractSchema } from "@/schemas/import";
import { createServerFn } from "@tanstack/react-start";
import { firecrawl } from "./fireclaw";
import { getSession } from "./session";

export const getItems = createServerFn({ method: "POST" })
  .inputValidator(importSchema)
  .handler(async ({ data }) => {
    const user = await getSession();
    if (!user?.user) {
      throw new Error("Unauthorized");
    }

    const scrapedData = await prisma.scrapedData.create({
      data: {
        url: data.url,
        userId: user.user.id,
        status: "PROCESSING",
      },
    });

    try {
      const result = await firecrawl.scrape(data.url, {
        formats: [
          "markdown",
          {
            type: "json",
            schema: scrapeExtractSchema,
          },
        ],
        onlyMainContent: true,
      });

      const jsonData = result.json as ScrapeExtractSchema;

      const updatedScrapedData = await prisma.scrapedData.update({
        where: { id: scrapedData.id },
        data: {
          title: result.metadata?.title,
          content: result.markdown,
          ogImage: result.metadata?.ogImage,
          author: jsonData.author ?? null,
          publishedAt: new Date(jsonData.publishedAt ?? ""),
          status: "COMPLETED",
        },
      });

      return updatedScrapedData;
    } catch (error) {
      const failedScrapedData = await prisma.scrapedData.update({
        where: { id: scrapedData.id },
        data: {
          status: "FAILED",
        },
      });

      return failedScrapedData;
    }
  });
