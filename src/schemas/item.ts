import { fallback } from "@tanstack/zod-adapter";
import { z } from "zod";

export const ITEMS_PER_PAGE = 12;

export const ITEM_STATUS_FILTERS = [
  "all",
  "pending",
  "processing",
  "completed",
  "failed",
] as const;

export type ItemStatusFilter = (typeof ITEM_STATUS_FILTERS)[number];

export const itemSearchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  status: fallback(z.enum(ITEM_STATUS_FILTERS), "all").default("all"),
  page: fallback(z.number().int().min(1), 1).default(1),
});

export type ItemSearch = z.infer<typeof itemSearchSchema>;
