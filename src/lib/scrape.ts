import { importSchema } from "@/schemas/import";
import { createServerFn } from "@tanstack/react-start";
import { firecrawl } from "./fireclaw";

export const getItems = createServerFn({ method: "POST" })
  .inputValidator(importSchema)
  .handler(async ({ data }) => {
    const result = await firecrawl.scrape(data.url, {
      formats: ["markdown"],
      onlyMainContent: true,
    });

    console.log(result);
  });
