import { prisma } from "#/db";
import { authFnMiddleware } from "@/middlewares/auth";
import type { ScrapeExtractSchema } from "@/schemas/import";
import {
  bulkImportSchema,
  importSchema,
  scrapeExtractSchema,
} from "@/schemas/import";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { firecrawl } from "./fireclaw";

export const getItems = createServerFn({ method: "POST" })
  .middleware([authFnMiddleware])
  .inputValidator(importSchema)
  .handler(async ({ data, context }) => {
    const user = context.session?.user;
    if (!user) throw new Error("Unauthorized");

    const scrapedData = await prisma.scrapedData.create({
      data: {
        url: data.url,
        userId: user.id,
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
        location: {
          country: "US",
          languages: ["en"],
        },
        onlyMainContent: true,
        proxy: "auto",
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

export const mapUrlFn = createServerFn({ method: "POST" })
  .middleware([authFnMiddleware])
  .inputValidator(bulkImportSchema)
  .handler(async ({ data }) => {
    const result = await firecrawl.map(data.urls, {
      limit: 20,
      search: data.search,
      location: {
        country: "US",
        languages: ["en"],
      },
    });

    return result.links;
  });

export const bulkScrapeUrlsFn = createServerFn({ method: "POST" })
  .middleware([authFnMiddleware])
  .inputValidator(z.object({ urls: z.array(z.string().url()) }))
  .handler(async ({ data, context }) => {
    const user = context.session?.user;
    if (!user) throw new Error("Unauthorized");

    for (const url of data.urls) {
      const mappedScrapeData = await prisma.scrapedData.create({
        data: {
          url: url,
          userId: user.id,
          status: "PENDING",
        },
      });

      try {
        const result = await firecrawl.scrape(url, {
          formats: [
            "markdown",
            {
              type: "json",
              schema: scrapeExtractSchema,
            },
          ],
          location: {
            country: "US",
            languages: ["en"],
          },
          onlyMainContent: true,
          proxy: "auto",
        });

        const jsonData = result.json as ScrapeExtractSchema;

        await prisma.scrapedData.update({
          where: { id: mappedScrapeData.id },
          data: {
            title: result.metadata?.title,
            content: result.markdown,
            ogImage: result.metadata?.ogImage,
            author: jsonData.author ?? null,
            publishedAt: new Date(jsonData.publishedAt ?? ""),
            status: "COMPLETED",
          },
        });
      } catch (error) {
        await prisma.scrapedData.update({
          where: { id: mappedScrapeData.id },
          data: {
            status: "FAILED",
          },
        });
      }
    }
  });
