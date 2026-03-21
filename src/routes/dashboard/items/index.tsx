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
import { timeAgo } from "@/helper/format";
import { copyToClipboardFn } from "@/lib/clipboard";
import { getItemsFn } from "@/lib/scrape";
import { itemSearchSchema } from "@/schemas/item";
import type { ScrapedData } from "@/types/scraped-data";
import { SCRAPED_DATA_STATUSES } from "@/types/scraped-data";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { BookmarkIcon, Copy, ImportIcon } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/dashboard/items/")({
  component: RouteComponent,
  loader: () => getItemsFn(),
  validateSearch: zodValidator(itemSearchSchema),
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
            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-muted to-muted-foreground/10">
              <BookmarkIcon className="size-10 text-muted-foreground/40" />
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
  const data = Route.useLoaderData();
  const { q, status } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    if (searchInput === q) return;

    const timeout = setTimeout(() => {
      navigate({ search: (prev) => ({ ...prev, q: searchInput }) });
    }, 500);

    return () => clearTimeout(timeout);
  }, [searchInput, q, navigate]);

  const filteredItems = data.filter((item: ScrapedData) => {
    // Filter by search query (matches title or tags)
    const matchesQuery =
      q === "" ||
      item.title?.toLowerCase().includes(q.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(q.toLowerCase()));

    const matchesStatus = status === "all" || item.status === status;

    return matchesQuery && matchesStatus;
  });

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
          placeholder="Search by title or tags..."
          className="max-w-sm bg-background"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Select
          value={status}
          onValueChange={(value) =>
            navigate({
              search: (prev) => ({
                ...prev,
                status: value as typeof status,
              }),
            })
          }
        >
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4}>
            <SelectItem value="all">All</SelectItem>
            {SCRAPED_DATA_STATUSES.map((statusValue) => (
              <SelectItem key={statusValue} value={statusValue}>
                {statusValue.charAt(0) + statusValue.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState hasItems={data.length > 0} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item: ScrapedData) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
