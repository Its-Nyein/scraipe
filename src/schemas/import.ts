import { z } from "zod";

export const importSchema = z.object({
  url: z.string().url(),
});

export const bulkImportSchema = z.object({
  urls: z.string().url(),
  search: z.string(),
});

export const scrapeExtractSchema = z.object({
  author: z.string().nullable(),
  publishedAt: z.string().nullable(),
});

export type ImportSchema = z.infer<typeof importSchema>;
export type BulkImportSchema = z.infer<typeof bulkImportSchema>;
export type ScrapeExtractSchema = z.infer<typeof scrapeExtractSchema>;
