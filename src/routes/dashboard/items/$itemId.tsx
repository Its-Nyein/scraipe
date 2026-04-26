import { MessageResponse } from "@/components/ai-elements/message";
import { CollectionsPicker } from "@/components/collections-picker";
import { ShareDialog } from "@/components/share-dialog";
import { TagEditor } from "@/components/tag-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { AnimatedShinyText } from "@/components/ui/magic/animated-shiny-text";
import { ScrambleText } from "@/components/ui/magic/scramble-text";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { VirtualizedMarkdown } from "@/components/virtualized-markdown";
import { formatDate, timeAgo } from "@/helper/format";
import { getItemCollectionsFn, listCollectionsFn } from "@/lib/collection";
import { sanitizeContent } from "@/lib/sanitize";
import { generateTagsFn, getItemByIdFn, saveSummaryFn } from "@/lib/scrape";
import { cn } from "@/lib/utils";
import { useCompletion } from "@ai-sdk/react";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  BookmarkIcon,
  Brain,
  Calendar,
  ChevronDown,
  Clock,
  ExternalLink,
  Loader2,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/items/$itemId")({
  component: RouteComponent,
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
  loader: async ({ params }) => {
    const [item, allCollections, itemCollections] = await Promise.all([
      getItemByIdFn({ data: { id: params.itemId } }),
      listCollectionsFn(),
      getItemCollectionsFn({ data: { itemId: params.itemId } }),
    ]);
    return { item, allCollections, itemCollections };
  },
  head: ({ loaderData }) => {
    const item = loaderData?.item;
    const title = item?.title ?? "Item Details";
    const description =
      item?.summary ?? "View saved article details and AI-generated summary";
    const image = item?.ogImage;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        ...(image ? [{ property: "og:image", content: image }] : []),
        {
          name: "twitter:card",
          content: image ? "summary_large_image" : "summary",
        },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...(image ? [{ name: "twitter:image", content: image }] : []),
        ...(item?.author ? [{ name: "author", content: item.author }] : []),
      ],
    };
  },
});

function PendingComponent() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-7 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold">
          <ScrambleText text="Item Details" />
        </h1>
      </div>
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="aspect-video w-full rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    </div>
  );
}

function ErrorComponent() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-7 px-4">
      <div className="mx-auto w-full max-w-3xl">
        <Empty className="min-h-[320px]">
          <EmptyHeader>
            <EmptyMedia variant="icon-lg">
              <AlertCircle />
            </EmptyMedia>
            <EmptyTitle>Something went wrong</EmptyTitle>
            <EmptyDescription>
              We couldn't load this item. Please try again later.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" asChild>
            <Link to="/dashboard/items">
              <ArrowLeft className="size-4" />
              Back to items
            </Link>
          </Button>
        </Empty>
      </div>
    </div>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-7 px-4">
      <div className="mx-auto w-full max-w-3xl">
        <Empty className="min-h-[320px]">
          <EmptyHeader>
            <EmptyMedia variant="icon-lg">
              <BookmarkIcon />
            </EmptyMedia>
            <EmptyTitle>Item not found</EmptyTitle>
            <EmptyDescription>
              This item may have been deleted or you don't have access to it.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" asChild>
            <Link to="/dashboard/items">
              <ArrowLeft className="size-4" />
              Back to items
            </Link>
          </Button>
        </Empty>
      </div>
    </div>
  );
}

function RouteComponent() {
  const router = useRouter();
  const { item: data, allCollections, itemCollections } = Route.useLoaderData();

  const [isContentOpen, setIsContentOpen] = useState(false);

  const { completion, complete, isLoading } = useCompletion({
    api: "/api/ai/summary",
    initialCompletion: data.summary ? data.summary : undefined,
    streamProtocol: "text",
    body: {
      itemId: data.id,
    },
    onFinish: (_prompt, completionText) => {
      toast.success("Summary generated and saved!");

      // Save summary then generate tags, invalidate once at the end
      saveSummaryFn({
        data: {
          id: data.id,
          summary: completionText,
        },
      })
        .then(() =>
          generateTagsFn({
            data: {
              id: data.id,
              summary: completionText,
            },
          }),
        )
        .catch((e) => {
          console.error("Failed to generate tags:", e);
        })
        .finally(() => {
          router.invalidate();
        });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function handleGenerateSummary() {
    if (!data.content) {
      toast.error("No content available to summarize");
      return;
    }

    complete(data.content);
  }

  const cleanContent = useMemo(
    () => (data.content ? sanitizeContent(data.content) : null),
    [data.content],
  );

  return (
    <div className="flex flex-1 flex-col gap-4 py-7 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold">
          <ScrambleText text="Item Details" />
        </h1>
        <p className="pt-0">
          <AnimatedShinyText>{data.title ?? "Untitled"}</AnimatedShinyText>
        </p>
      </div>

      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link to="/dashboard/items">
              <ArrowLeft className="size-4" />
              Back to items
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <ShareDialog
              itemId={data.id}
              title={data.title}
              content={data.content}
              isPublic={data.isPublic}
              shareSlug={data.shareSlug}
            />
            <CollectionsPicker
              itemId={data.id}
              allCollections={allCollections}
              itemCollections={itemCollections}
            />
          </div>
        </div>

        {data.ogImage ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
            <img
              src={data.ogImage}
              alt={data.title ?? "Item image"}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-stone-900">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, rgba(194, 65, 12, 0.18) 0%, rgba(194, 65, 12, 0.1) 25%, rgba(194, 65, 12, 0.04) 35%, transparent 50%)`,
              }}
            />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge
              variant={
                data.status === "COMPLETED"
                  ? "default"
                  : data.status === "FAILED"
                    ? "destructive"
                    : "outline"
              }
            >
              {data.status.toLowerCase()}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {timeAgo(data.createdAt)}
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">{data.title}</h2>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {data.author && (
              <span className="inline-flex items-center gap-1.5">
                <User className="size-3.5" />
                {data.author}
              </span>
            )}
            {data.publishedAt && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                {formatDate(data.publishedAt)}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" />
              Saved {formatDate(data.createdAt)}
            </span>
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              <ExternalLink className="size-3.5" />
              Source
            </a>
          </div>

          <TagEditor itemId={data.id} initialTags={data.tags} />
        </div>

        {/* AI Summary */}
        <Card className="overflow-hidden">
          <CardContent className="pt-5">
            <div className="flex items-start justify-center gap-3">
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-uppercase tracking-tight mb-3">
                  AI Summary
                </h2>
                {completion || data.summary ? (
                  <MessageResponse>{completion}</MessageResponse>
                ) : (
                  <p className="italic text-muted-foreground">
                    {data.content
                      ? "Click the button below to generate a summary"
                      : "No summary available"}
                  </p>
                )}
              </div>

              {data.content && !data.summary && !completion && (
                <Button
                  onClick={handleGenerateSummary}
                  disabled={isLoading}
                  size="sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {cleanContent && (
          <Card className="overflow-hidden">
            <CardContent className="pt-5">
              <div className="relative">
                {isContentOpen ? (
                  <VirtualizedMarkdown content={cleanContent} />
                ) : (
                  <>
                    <div className="item-content overflow-hidden max-h-72">
                      <MessageResponse>{cleanContent}</MessageResponse>
                    </div>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-card to-transparent" />
                  </>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="mt-3 w-full text-muted-foreground hover:text-foreground"
                onClick={() => setIsContentOpen(!isContentOpen)}
              >
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform duration-200",
                    isContentOpen && "rotate-180",
                  )}
                />
                {isContentOpen ? "Show less" : "Read more"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
