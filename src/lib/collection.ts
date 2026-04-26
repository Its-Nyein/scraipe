import { prisma } from "#/db";
import { authFnMiddleware } from "@/middlewares/auth";
import {
  collectionItemsSchema,
  createCollectionSchema,
  setItemTagsSchema,
  updateCollectionSchema,
} from "@/schemas/collection";
import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listCollectionsFn = createServerFn({ method: "GET" })
  .middleware([authFnMiddleware])
  .handler(async ({ context }) => {
    const user = context.session?.user;
    if (!user) throw new Error("Unauthorized");

    const collections = await prisma.collection.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { items: true } } },
    });

    return collections.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      itemCount: c._count.items,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  });

export const getCollectionByIdFn = createServerFn({ method: "GET" })
  .middleware([authFnMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    const user = context.session?.user;
    if (!user) throw new Error("Unauthorized");

    const collection = await prisma.collection.findFirst({
      where: { id: data.id, userId: user.id },
      include: {
        items: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!collection) throw notFound();
    return collection;
  });

export const getItemCollectionsFn = createServerFn({ method: "GET" })
  .middleware([authFnMiddleware])
  .inputValidator(z.object({ itemId: z.string() }))
  .handler(async ({ context, data }) => {
    const user = context.session?.user;
    if (!user) throw new Error("Unauthorized");

    const collections = await prisma.collection.findMany({
      where: {
        userId: user.id,
        items: { some: { id: data.itemId, userId: user.id } },
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });

    return collections;
  });

export const createCollectionFn = createServerFn({ method: "POST" })
  .middleware([authFnMiddleware])
  .inputValidator(createCollectionSchema)
  .handler(async ({ context, data }) => {
    const user = context.session?.user;
    if (!user) throw new Error("Unauthorized");

    const existing = await prisma.collection.findFirst({
      where: { userId: user.id, name: data.name },
    });
    if (existing) {
      throw new Error("A collection with that name already exists");
    }

    return prisma.collection.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        userId: user.id,
      },
    });
  });

export const updateCollectionFn = createServerFn({ method: "POST" })
  .middleware([authFnMiddleware])
  .inputValidator(updateCollectionSchema)
  .handler(async ({ context, data }) => {
    const user = context.session?.user;
    if (!user) throw new Error("Unauthorized");

    const owned = await prisma.collection.findFirst({
      where: { id: data.id, userId: user.id },
    });
    if (!owned) throw notFound();

    return prisma.collection.update({
      where: { id: data.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
      },
    });
  });

export const deleteCollectionFn = createServerFn({ method: "POST" })
  .middleware([authFnMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    const user = context.session?.user;
    if (!user) throw new Error("Unauthorized");

    const result = await prisma.collection.deleteMany({
      where: { id: data.id, userId: user.id },
    });

    if (result.count === 0) throw notFound();
    return { ok: true };
  });

export const addItemsToCollectionFn = createServerFn({ method: "POST" })
  .middleware([authFnMiddleware])
  .inputValidator(collectionItemsSchema)
  .handler(async ({ context, data }) => {
    const user = context.session?.user;
    if (!user) throw new Error("Unauthorized");

    const collection = await prisma.collection.findFirst({
      where: { id: data.collectionId, userId: user.id },
    });
    if (!collection) throw notFound();

    const ownedItems = await prisma.scrapedData.findMany({
      where: { id: { in: data.itemIds }, userId: user.id },
      select: { id: true },
    });

    return prisma.collection.update({
      where: { id: data.collectionId },
      data: {
        items: {
          connect: ownedItems.map((item) => ({ id: item.id })),
        },
      },
    });
  });

export const removeItemsFromCollectionFn = createServerFn({ method: "POST" })
  .middleware([authFnMiddleware])
  .inputValidator(collectionItemsSchema)
  .handler(async ({ context, data }) => {
    const user = context.session?.user;
    if (!user) throw new Error("Unauthorized");

    const collection = await prisma.collection.findFirst({
      where: { id: data.collectionId, userId: user.id },
    });
    if (!collection) throw notFound();

    return prisma.collection.update({
      where: { id: data.collectionId },
      data: {
        items: {
          disconnect: data.itemIds.map((id) => ({ id })),
        },
      },
    });
  });

export const setItemTagsFn = createServerFn({ method: "POST" })
  .middleware([authFnMiddleware])
  .inputValidator(setItemTagsSchema)
  .handler(async ({ context, data }) => {
    const user = context.session?.user;
    if (!user) throw new Error("Unauthorized");

    const normalized = Array.from(
      new Set(
        data.tags
          .map((tag) => tag.trim().toLowerCase())
          .filter((tag) => tag.length > 0),
      ),
    );

    const result = await prisma.scrapedData.updateMany({
      where: { id: data.id, userId: user.id },
      data: { tags: normalized },
    });

    if (result.count === 0) throw notFound();
    return { id: data.id, tags: normalized };
  });
