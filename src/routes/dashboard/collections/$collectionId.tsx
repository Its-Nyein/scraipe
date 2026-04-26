import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { AnimatedShinyText } from "@/components/ui/magic/animated-shiny-text";
import { ScrambleText } from "@/components/ui/magic/scramble-text";
import { timeAgo } from "@/helper/format";
import {
  getCollectionByIdFn,
  removeItemsFromCollectionFn,
} from "@/lib/collection";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft, BookmarkIcon, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/collections/$collectionId")({
  component: RouteComponent,
  loader: ({ params }) =>
    getCollectionByIdFn({ data: { id: params.collectionId } }),
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.name ?? "Collection" },
      {
        name: "description",
        content: loaderData?.description ?? "Collection details",
      },
    ],
  }),
});

function RemoveItemButton({
  collectionId,
  itemId,
  title,
}: {
  collectionId: string;
  itemId: string;
  title: string;
}) {
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleRemove() {
    setIsRemoving(true);
    try {
      await removeItemsFromCollectionFn({
        data: { collectionId, itemIds: [itemId] },
      });
      toast.success("Removed from collection");
      router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-destructive"
          aria-label={`Remove ${title} from collection`}
        >
          {isRemoving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <X className="size-4" />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove from collection?</AlertDialogTitle>
          <AlertDialogDescription>
            "{title}" will be removed from this collection. The item itself will
            not be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRemove} disabled={isRemoving}>
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RouteComponent() {
  const collection = Route.useLoaderData();

  return (
    <div className="flex flex-1 flex-col gap-4 py-7 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold">
          <ScrambleText text={collection.name} />
        </h1>
        {collection.description && (
          <p className="pt-0">
            <AnimatedShinyText>{collection.description}</AnimatedShinyText>
          </p>
        )}
      </div>

      <div className="mx-auto w-full max-w-6xl space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/dashboard/collections">
            <ArrowLeft className="size-4" />
            Back to collections
          </Link>
        </Button>

        <div className="text-sm text-muted-foreground">
          {collection.items.length} item
          {collection.items.length === 1 ? "" : "s"}
        </div>

        {collection.items.length === 0 ? (
          <Empty className="min-h-[280px]">
            <EmptyHeader>
              <EmptyMedia variant="icon-lg">
                <BookmarkIcon />
              </EmptyMedia>
              <EmptyTitle>No items in this collection</EmptyTitle>
              <EmptyDescription>
                Open any saved item and add it to this collection.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collection.items.map((item) => (
              <Card
                key={item.id}
                className="group relative overflow-hidden p-0 transition-all hover:shadow-lg"
              >
                <Link
                  to="/dashboard/items/$itemId"
                  params={{ itemId: item.id }}
                  className="block"
                >
                  <div className="aspect-video overflow-hidden w-full bg-muted">
                    {item.ogImage ? (
                      <img
                        src={item.ogImage}
                        alt={item.title ?? "Item image"}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full relative bg-stone-900">
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(194, 65, 12, 0.18) 0%, rgba(194, 65, 12, 0.1) 25%, rgba(194, 65, 12, 0.04) 35%, transparent 50%)`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 px-5 py-4">
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant={
                          item.status === "COMPLETED"
                            ? "default"
                            : item.status === "FAILED"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {item.status.toLowerCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(item.createdAt)}
                      </span>
                    </div>
                    <h3 className="line-clamp-2 text-lg font-semibold leading-snug group-hover:text-primary transition-colors">
                      {item.title ?? "Untitled"}
                    </h3>
                    {item.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.summary}
                      </p>
                    )}
                    {item.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {item.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
                <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <RemoveItemButton
                    collectionId={collection.id}
                    itemId={item.id}
                    title={item.title ?? "this item"}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
