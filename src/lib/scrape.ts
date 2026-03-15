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
          publishedAt: jsonData.publishedAt
            ? new Date(jsonData.publishedAt)
            : null,
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

    const records = await Promise.all(
      data.urls.map((url) =>
        prisma.scrapedData.create({
          data: { url, userId: user.id, status: "PENDING" },
        }),
      ),
    );

    await Promise.allSettled(
      records.map(async (record, i) => {
        try {
          const result = await firecrawl.scrape(data.urls[i], {
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
            where: { id: record.id },
            data: {
              title: result.metadata?.title,
              content: result.markdown,
              ogImage: result.metadata?.ogImage,
              author: jsonData.author ?? null,
              publishedAt: jsonData.publishedAt
                ? new Date(jsonData.publishedAt)
                : null,
              status: "COMPLETED",
            },
          });
        } catch (error) {
          await prisma.scrapedData.update({
            where: { id: record.id },
            data: { status: "FAILED" },
          });
        }
      }),
    );
  });

export const getItemsFn = createServerFn({ method: "GET" })
  .middleware([authFnMiddleware])
  .handler(async ({ context }) => {
    const user = context.session?.user;
    if (!user) throw new Error("Unauthorized");

    const items = await prisma.scrapedData.findMany({
      where: { userId: user.id },
      orderBy: {
        createdAt: "desc",
      },
    });

    return items;
  });
