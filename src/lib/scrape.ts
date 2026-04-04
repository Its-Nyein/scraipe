import { prisma } from "#/db";
import { authFnMiddleware } from "@/middlewares/auth";
import type { ScrapeExtractSchema } from "@/schemas/import";
import { bulkImportSchema, importSchema, searchSchema } from "@/schemas/import";
import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import z from "zod";
import { firecrawl } from "./fireclaw";
import { openrouter } from "./open-router";

const extractJsonSchema = {
  type: "object",
  properties: {
    author: { type: ["string", "null"] },
    publishedAt: { type: ["string", "null"] },
  },
  required: ["author", "publishedAt"],
} as const;

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
            schema: extractJsonSchema,
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

export const searchWebFn = createServerFn({ method: "POST" })
  .middleware([authFnMiddleware])
  .inputValidator(searchSchema)
  .handler(async ({ data }) => {
    const result = await firecrawl.search(data.query, {
      limit: 20,
      // time based search
      tbs: "qdr: y",
    });

    const webResults = (result.web ?? []).map((item) => ({
      url: "url" in item ? item.url : "",
      title: "title" in item ? (item.title as string) : null,
      description: "description" in item ? (item.description as string) : null,
    }));

    return webResults;
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
                schema: extractJsonSchema,
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

export const getDashboardStatsFn = createServerFn({ method: "GET" })
  .middleware([authFnMiddleware])
  .handler(async ({ context }) => {
    const user = context.session?.user;
    if (!user) throw new Error("Unauthorized");

    const [total, completed, processing, failed, recentItems] =
      await Promise.all([
        prisma.scrapedData.count({ where: { userId: user.id } }),
        prisma.scrapedData.count({
          where: { userId: user.id, status: "COMPLETED" },
        }),
        prisma.scrapedData.count({
          where: {
            userId: user.id,
            status: { in: ["PROCESSING", "PENDING"] },
          },
        }),
        prisma.scrapedData.count({
          where: { userId: user.id, status: "FAILED" },
        }),
        prisma.scrapedData.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);

    const withSummary = await prisma.scrapedData.count({
      where: { userId: user.id, summary: { not: null } },
    });

    return { total, completed, processing, failed, withSummary, recentItems };
  });

export const getItemByIdFn = createServerFn({ method: "GET" })
  .middleware([authFnMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    const user = context.session?.user;
    if (!user) throw new Error("Unauthorized");

    const item = await prisma.scrapedData.findUnique({
      where: {
        id: data.id,
        userId: user.id,
      },
    });

    if (!item) throw notFound();

    return item;
  });

export const saveSummaryFn = createServerFn({
  method: "POST",
})
  .middleware([authFnMiddleware])
  .inputValidator(
    z.object({
      id: z.string(),
      summary: z.string(),
    }),
  )
  .handler(async ({ context, data }) => {
    const user = context.session?.user;
    if (!user) throw new Error("Unauthorized");

    const item = await prisma.scrapedData.update({
      where: {
        userId: user.id,
        id: data.id,
      },
      data: {
        summary: data.summary,
      },
    });

    return item;
  });

export const generateTagsFn = createServerFn({
  method: "POST",
})
  .middleware([authFnMiddleware])
  .inputValidator(
    z.object({
      id: z.string(),
      summary: z.string(),
    }),
  )
  .handler(async ({ context, data }) => {
    const user = context.session?.user;
    if (!user) throw new Error("Unauthorized");

    const { text } = await generateText({
      model: openrouter.chat("stepfun/step-3.5-flash:free"),
      system: `You are a helpful assistant that extracts relevant tags from content summaries.
  Extract 3-5 short, relevant tags that categorize the content.
  Return ONLY a comma-separated list of tags, nothing else.
  Example: technology, programming, web development, javascript`,
      prompt: `Extract tags from this summary: \n\n${data.summary}`,
    });

    const tags = text
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0)
      .slice(0, 5);

    const item = await prisma.scrapedData.update({
      where: {
        userId: user.id,
        id: data.id,
      },
      data: {
        tags: tags,
      },
    });

    return item;
  });
