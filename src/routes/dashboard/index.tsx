import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { AnimatedShinyText } from "@/components/ui/magic/animated-shiny-text";
import { ScrambleText } from "@/components/ui/magic/scramble-text";
import { timeAgo } from "@/helper/format";
import { authClient } from "@/lib/auth-client";
import { getDashboardStatsFn } from "@/lib/scrape";
import type { ScrapedData } from "@/types/scraped-data";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BookmarkIcon,
  Brain,
  CheckCircle2,
  CircleDot,
  CompassIcon,
  ImportIcon,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: RouteComponent,
  loader: () => getDashboardStatsFn(),
  head: () => ({
    meta: [
      { title: "Dashboard" },
      {
        name: "description",
        content: "Your knowledge base overview and recent activity.",
      },
      { property: "og:title", content: "Dashboard" },
      {
        property: "og:description",
        content: "Your knowledge base overview and recent activity.",
      },
    ],
  }),
});

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function RouteComponent() {
  const stats = Route.useLoaderData();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const firstName = user?.name.split(" ")[0] ?? "there";
  const greeting = getGreeting();

  return (
    <div className="flex flex-1 flex-col gap-4 py-7 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold">
          <ScrambleText text={`${greeting}, ${firstName}`} />
        </h1>
        <p className="pt-0">
          <AnimatedShinyText>
            {stats.total === 0
              ? "Start by importing your first article"
              : stats.processing > 0
                ? `${stats.processing} item${stats.processing > 1 ? "s" : ""} still processing...`
                : `You have ${stats.total} item${stats.total !== 1 ? "s" : ""} in your library`}
          </AnimatedShinyText>
        </p>
      </div>

      <div className="mx-auto w-full max-w-3xl space-y-8">
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/dashboard/import"
            className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <ImportIcon className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Import URL</p>
              <p className="text-xs text-muted-foreground">
                Add to your library
              </p>
            </div>
          </Link>
          <Link
            to="/dashboard/discover"
            className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <CompassIcon className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Discover</p>
              <p className="text-xs text-muted-foreground">Search the web</p>
            </div>
          </Link>
        </div>

        {stats.recentItems.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Recently saved
              </h3>
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link to="/dashboard/items">
                  All items <ArrowRight className="ml-1 size-3" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {stats.recentItems.map((item: ScrapedData) => (
                <Link
                  key={item.id}
                  to="/dashboard/items/$itemId"
                  params={{ itemId: item.id }}
                  className="group overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
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
                    <p className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary transition-colors">
                      {item.title ?? "Untitled"}
                    </p>
                    {item.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      {item.author && (
                        <span className="text-xs text-muted-foreground truncate">
                          {item.author}
                        </span>
                      )}
                      {item.summary && (
                        <>
                          {item.author && (
                            <span className="text-muted-foreground/30">·</span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Brain className="size-3" />
                            Summarized
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <Empty className="min-h-[280px]">
            <EmptyHeader>
              <EmptyMedia variant="icon-lg">
                <BookmarkIcon />
              </EmptyMedia>
              <EmptyTitle>Your library is empty</EmptyTitle>
              <EmptyDescription>
                Import an article or discover something new to get started.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <div className="flex gap-2">
                <Button asChild>
                  <Link to="/dashboard/import">
                    <ImportIcon className="size-4" />
                    Import URL
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/dashboard/discover">
                    <CompassIcon className="size-4" />
                    Discover
                  </Link>
                </Button>
              </div>
            </EmptyContent>
          </Empty>
        )}

        {stats.total > 0 && (
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pb-4">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3 text-emerald-500" />
              {stats.completed} completed
            </span>
            {stats.processing > 0 && (
              <span className="flex items-center gap-1.5">
                <CircleDot className="size-3 text-amber-500" />
                {stats.processing} processing
              </span>
            )}
            {stats.failed > 0 && (
              <span className="flex items-center gap-1.5">
                <XCircle className="size-3 text-destructive" />
                {stats.failed} failed
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Brain className="size-3 text-primary" />
              {stats.withSummary} summaries
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
