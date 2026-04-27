import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { AnimatedShinyText } from "@/components/ui/magic/animated-shiny-text";
import { ScrambleText } from "@/components/ui/magic/scramble-text";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataPagination } from "@/components/data-pagination";
import { timeAgo } from "@/helper/format";
import { useItemsSearchParams } from "@/hooks/use-items-search-params";
import { copyToClipboardFn } from "@/lib/clipboard";
import { getItemsFn } from "@/lib/scrape";
import {
  ITEM_STATUS_FILTERS,
  ITEMS_PER_PAGE,
  itemSearchSchema,
} from "@/schemas/item";
import type { ScrapedData } from "@/types/scraped-data";
import { Link, createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { BookmarkIcon, Copy, ImportIcon } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/dashboard/items/")({
  component: RouteComponent,
  validateSearch: zodValidator(itemSearchSchema),
  loaderDeps: ({ search }) => ({
    page: search.page,
    q: search.q,
    status: search.status,
  }),
  loader: ({ deps }) =>
    getItemsFn({
      data: { ...deps, pageSize: ITEMS_PER_PAGE },
    }),
  head: () => ({
    meta: [
      { title: "Saved Items" },
      {
        name: "description",
        content:
          "Browse and manage your saved articles, bookmarks, and content.",
      },
      { property: "og:title", content: "Saved Items" },
      {
        property: "og:description",
        content:
          "Browse and manage your saved articles, bookmarks, and content.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Saved Items" },
      {
        name: "twitter:description",
        content:
          "Browse and manage your saved articles, bookmarks, and content.",
      },
    ],
  }),
});

function EmptyState({ hasItems }: { hasItems: boolean }) {
  return (
    <Empty className="min-h-[320px]">
      <EmptyHeader>
        <EmptyMedia variant="icon-lg">
          <BookmarkIcon />
        </EmptyMedia>
        <EmptyTitle>{hasItems ? "No items found" : "No items yet"}</EmptyTitle>
        <EmptyDescription>
          {hasItems
            ? "No items match your current search or filter. Try adjusting your filters."
            : "Start building your knowledge base by importing your favorite websites and articles."}
        </EmptyDescription>
      </EmptyHeader>
      {!hasItems && (
        <EmptyContent>
          <Button asChild>
            <Link to="/dashboard/import">
              <ImportIcon className="size-4" />
              Import your first URL
            </Link>
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}

function ItemCard({ item }: { item: ScrapedData }) {
  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg">
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
            <div className="flex items-center gap-2">
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      await copyToClipboardFn(item.url);
                    }}
                  >
                    <Copy className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy URL</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <h3 className="line-clamp-2 text-lg font-semibold leading-snug group-hover:text-primary transition-colors">
            {item.title ?? "Untitled"}
          </h3>

          {item.summary && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.summary}
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            {item.author && (
              <p className="text-sm text-muted-foreground truncate">
                {item.author}
              </p>
            )}
            {item.tags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {item.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
}

function RouteComponent() {
  const { items, total, totalPages } = Route.useLoaderData();
  const [{ q, status, page }, setSearch] = useItemsSearchParams();

  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    if (searchInput === q) return;

    const timeout = setTimeout(() => {
      setSearch({ q: searchInput, page: 1 });
    }, 500);

    return () => clearTimeout(timeout);
  }, [searchInput, q, setSearch]);

  const hasFilters = q !== "" || status !== "all";

  return (
    <div className="flex flex-1 flex-col gap-4 py-7 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold">
          <ScrambleText text="Items" />
        </h1>
        <p className="pt-0">
          <AnimatedShinyText>
            Your saved articles and contents
          </AnimatedShinyText>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Search by title or tag..."
          className="max-w-sm bg-background"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Select
          value={status}
          onValueChange={(value) =>
            setSearch({ status: value as typeof status, page: 1 })
          }
        >
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4}>
            {ITEM_STATUS_FILTERS.map((value) => (
              <SelectItem key={value} value={value}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {items.length === 0 ? (
        <EmptyState hasItems={hasFilters} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item: ScrapedData) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
          <div className="flex items-center justify-between gap-4 pt-2">
            <p className="text-sm text-muted-foreground">
              {total} item{total === 1 ? "" : "s"}
            </p>
            <DataPagination
              page={page}
              pageCount={totalPages}
              onPageChange={(next) => setSearch({ page: next })}
            />
          </div>
        </>
      )}
    </div>
  );
}
