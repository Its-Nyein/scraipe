import { prisma } from "#/db";
import { authFnMiddleware } from "@/middlewares/auth";
import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import crypto from "node:crypto";
import { z } from "zod";

const SLUG_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const SLUG_LENGTH = 10;

function generateSlug(): string {
  const bytes = crypto.randomBytes(SLUG_LENGTH);
  let out = "";
  for (let i = 0; i < SLUG_LENGTH; i++) {
    out += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length];
  }
  return out;
}

export const toggleShareFn = createServerFn({ method: "POST" })
  .middleware([authFnMiddleware])
  .inputValidator(z.object({ id: z.string(), isPublic: z.boolean() }))
  .handler(async ({ context, data }) => {
    const user = context.session?.user;
    if (!user) throw new Error("Unauthorized");

    const item = await prisma.scrapedData.findFirst({
      where: { id: data.id, userId: user.id },
      select: { id: true, shareSlug: true },
    });
    if (!item) throw notFound();

    let slug = item.shareSlug;
    if (data.isPublic && !slug) {
      // Retry on the unlikely event of a slug collision.
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateSlug();
        const exists = await prisma.scrapedData.findUnique({
          where: { shareSlug: candidate },
          select: { id: true },
        });
        if (!exists) {
          slug = candidate;
          break;
        }
      }
      if (!slug) throw new Error("Could not generate a unique share slug");
    }

    const updated = await prisma.scrapedData.update({
      where: { id: data.id },
      data: {
        isPublic: data.isPublic,
        ...(slug && !item.shareSlug ? { shareSlug: slug } : {}),
      },
      select: { id: true, isPublic: true, shareSlug: true },
    });

    return updated;
  });

export const getPublicItemBySlugFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    const item = await prisma.scrapedData.findUnique({
      where: { shareSlug: data.slug },
      select: {
        id: true,
        url: true,
        title: true,
        content: true,
        summary: true,
        tags: true,
        author: true,
        publishedAt: true,
        ogImage: true,
        createdAt: true,
        isPublic: true,
      },
    });

    if (!item || !item.isPublic) throw notFound();

    return item;
  });
