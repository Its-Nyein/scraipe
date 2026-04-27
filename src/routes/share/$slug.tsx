import { MessageResponse } from "@/components/ai-elements/message";
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
import { Skeleton } from "@/components/ui/skeleton";
import { VirtualizedMarkdown } from "@/components/virtualized-markdown";
import { formatDate } from "@/helper/format";
import { sanitizeContent } from "@/lib/sanitize";
import { getPublicItemBySlugFn } from "@/lib/share";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  ExternalLink,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/share/$slug")({
  component: RouteComponent,
  pendingComponent: PendingComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
  loader: ({ params }) =>
    getPublicItemBySlugFn({ data: { slug: params.slug } }),
  head: ({ loaderData }) => {
    const title = loaderData?.title ?? "Shared item";
    const description = loaderData?.summary ?? "A shared item from Scraipe.";
    const image = loaderData?.ogImage;
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
      ],
    };
  },
});

function PendingComponent() {
  return (
    <PublicShell>
      <div className="space-y-6">
        <Skeleton className="aspect-video w-full rounded-lg" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-3/4" />
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-5 w-14 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-14 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    </PublicShell>
  );
}

function NotFoundComponent() {
  return (
    <PublicShell>
      <Empty className="min-h-[320px]">
        <EmptyHeader>
          <EmptyMedia variant="icon-lg">
            <AlertCircle />
          </EmptyMedia>
          <EmptyTitle>Link unavailable</EmptyTitle>
          <EmptyDescription>
            This share link doesn't exist or has been disabled.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </PublicShell>
  );
}

function ErrorComponent() {
  return (
    <PublicShell>
      <Empty className="min-h-[320px]">
        <EmptyHeader>
          <EmptyMedia variant="icon-lg">
            <AlertCircle />
          </EmptyMedia>
          <EmptyTitle>Something went wrong</EmptyTitle>
          <EmptyDescription>Please try again later.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </PublicShell>
  );
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80">
            <img src="/logo.svg" alt="Scraipe" className="size-6" />
            <span className="font-bold">Scraipe</span>
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link to="/">Get your own</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}

function RouteComponent() {
  const item = Route.useLoaderData();
  const [isContentOpen, setIsContentOpen] = useState(false);

  const cleanContent = useMemo(
    () => (item.content ? sanitizeContent(item.content) : null),
    [item.content],
  );

  return (
    <PublicShell>
      <div className="space-y-6">
        {item.ogImage && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
            <img
              src={item.ogImage}
              alt={item.title ?? "Item image"}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">
            {item.title ?? "Untitled"}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {item.author && (
              <span className="inline-flex items-center gap-1.5">
                <User className="size-3.5" />
                {item.author}
              </span>
            )}
            {item.publishedAt && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                {formatDate(item.publishedAt)}
              </span>
            )}
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              <ExternalLink className="size-3.5" />
              Original source
            </a>
          </div>

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="default">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {item.summary && (
          <Card className="overflow-hidden">
            <CardContent className="pt-5">
              <h2 className="text-sm font-semibold tracking-tight mb-3">
                Summary
              </h2>
              <MessageResponse>{item.summary}</MessageResponse>
            </CardContent>
          </Card>
        )}

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
                  className={
                    isContentOpen
                      ? "size-4 rotate-180 transition-transform duration-200"
                      : "size-4 transition-transform duration-200"
                  }
                />
                {isContentOpen ? "Show less" : "Read more"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PublicShell>
  );
}
