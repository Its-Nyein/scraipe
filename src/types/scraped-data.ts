export const SCRAPED_DATA_STATUSES = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
] as const;

export type ScrapedDataStatus = (typeof SCRAPED_DATA_STATUSES)[number];

export interface ScrapedData {
  id: string;
  url: string;
  title: string | null;
  content: string | null;
  summary: string | null;
  tags: string[];
  author: string | null;
  status: ScrapedDataStatus;
  publishedAt: Date | null;
  ogImage: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
