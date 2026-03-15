import { ScrapedDataStatus } from "@/generated/prisma/enums";
import { z } from "zod";

export const itemSearchSchema = z.object({
  q: z.string().default(""),
  status: z
    .union([z.literal("all"), z.nativeEnum(ScrapedDataStatus)])
    .default("all"),
});
