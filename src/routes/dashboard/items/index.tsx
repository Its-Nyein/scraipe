import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { copyToClipboardFn } from "@/lib/clipboard";
import { getItemsFn } from "@/lib/scrape";
import {
  SCRAPED_DATA_STATUSES,
  type ScrapedData,
} from "@/types/scraped-data";
import { Link, createFileRoute } from "@tanstack/react-router";
import { BookmarkIcon, Copy, ImportIcon } from "lucide-react";

export const Route = createFileRoute("/dashboard/items/")({
  component: RouteComponent,
  loader: () => getItemsFn(),
});

function timeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <BookmarkIcon className="size-8 text-muted-foreground" />
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold">No items yet</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Start building your knowledge base by importing your favorite
          websites and articles.
        </p>
      </div>
      <Button asChild className="rounded-full">
        <Link to="/dashboard/import">
          <ImportIcon className="size-4 mr-2" />
          Import your first URL
        </Link>
      </Button>
    </div>
  );
}

function ItemCard({ item }: { item: ScrapedData }) {
  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg">
      <Link to={`/dashboard/items/${item.id}`} className="block">
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

          <h3 className="line-clamp-2 text-lg font-semibold leading-snug group-hover:text-brand-primary transition-colors">
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

      {data.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search by title or author..."
              className="max-w-sm bg-background"
            />
            <Select>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                {SCRAPED_DATA_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((item: ScrapedData) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
