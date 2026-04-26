import { z } from "zod";

export const createCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  description: z.string().trim().max(500).optional(),
});

export const updateCollectionSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(500).nullable().optional(),
});

export const collectionItemsSchema = z.object({
  collectionId: z.string(),
  itemIds: z.array(z.string()).min(1),
});

export const setItemTagsSchema = z.object({
  id: z.string(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
});

export type CreateCollectionSchema = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionSchema = z.infer<typeof updateCollectionSchema>;
export type CollectionItemsSchema = z.infer<typeof collectionItemsSchema>;
export type SetItemTagsSchema = z.infer<typeof setItemTagsSchema>;
