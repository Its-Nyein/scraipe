import { z } from "zod";

export const importSchema = z.object({
  url: z.url(),
});

export const bulkImportSchema = z.object({
  urls: z.url(),
  search: z.string(),
});

export type ImportSchema = z.infer<typeof importSchema>;
export type BulkImportSchema = z.infer<typeof bulkImportSchema>;
