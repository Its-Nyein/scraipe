import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedShinyText } from "@/components/ui/magic/animated-shiny-text";
import { ScrambleText } from "@/components/ui/magic/scramble-text";
import { bulkScrapeUrlsFn, searchWebFn } from "@/lib/scrape";
import { searchSchema } from "@/schemas/import";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import {
  CompassIcon,
  ExternalLink,
  Globe,
  Loader2,
  Search,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/discover")({
  component: RouteComponent,
  head: () => ({
    meta: [
      { title: "Discover" },
      {
        name: "description",
        content:
          "Search the web for articles on any topic and import interesting content to your library.",
      },
      { property: "og:title", content: "Discover" },
      {
        property: "og:description",
        content:
          "Search the web for articles on any topic and import interesting content to your library.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Discover" },
      {
        name: "twitter:description",
        content:
          "Search the web for articles on any topic and import interesting content to your library.",
      },
    ],
  }),
});

function RouteComponent() {
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchResults, setSearchResults] = useState<
    { url: string; title: string | null; description: string | null }[]
  >([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(searchSchema),
    defaultValues: { query: "" },
  });

  const onSubmit = async (data: { query: string }) => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await searchWebFn({ data });
      setSearchResults(results);
      setSelectedUrls(new Set());
    } catch {
      toast.error("Failed to search. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const selectedCount = selectedUrls.size;
  const allSelected =
    searchResults.length > 0 && selectedCount === searchResults.length;

  function toggleUrl(url: string, checked: boolean) {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(url);
      } else {
        next.delete(url);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(searchResults.map((r) => r.url)));
    }
  }

  async function handleImport() {
    if (selectedCount === 0) {
      toast.error("Please select at least one URL to import.");
      return;
    }

    setIsImporting(true);
    try {
      await bulkScrapeUrlsFn({
        data: { urls: Array.from(selectedUrls) },
      });
      toast.success(
        `Imported ${selectedCount} URL${selectedCount > 1 ? "s" : ""} successfully`,
      );
      setSearchResults((prev) => prev.filter((r) => !selectedUrls.has(r.url)));
      setSelectedUrls(new Set());
    } catch {
      toast.error("Failed to import selected URLs.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center py-7">
      <div className="w-full max-w-2xl space-y-6 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            <ScrambleText text="Discover" />
          </h1>
          <p className="pt-0">
            <AnimatedShinyText>
              Search the web for articles on any topic
            </AnimatedShinyText>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-5 text-primary" />
              Deep Web Search
            </CardTitle>
            <CardDescription>
              Explore any topic across the web and pull the best content into
              your knowledge base.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-3">
                <Label htmlFor="query">Search Query</Label>
                <Input
                  id="query"
                  placeholder="e.g., AI Agentic Programming"
                  disabled={isSearching}
                  className="h-10 bg-background border-border"
                  autoComplete="off"
                  {...register("query")}
                />
                {errors.query && (
                  <p className="text-sm text-destructive">
                    {errors.query.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="h-10 w-full rounded-full font-medium"
                disabled={isSearching}
              >
                {isSearching ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Searching...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Search className="size-4" />
                    Search Web
                  </span>
                )}
              </Button>
            </form>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {selectedCount}/{searchResults.length} selected
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                  >
                    {allSelected ? "Clear selection" : "Select all"}
                  </Button>
                </div>

                <div className="max-h-96 space-y-2 overflow-y-auto rounded-lg border border-border p-2">
                  {searchResults.map((result, index) => (
                    <label
                      key={`${result.url}-${index}`}
                      className="hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-md p-2.5 transition-colors"
                    >
                      <Checkbox
                        className="mt-0.5"
                        checked={selectedUrls.has(result.url)}
                        onCheckedChange={(checked) =>
                          toggleUrl(result.url, checked === true)
                        }
                      />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="truncate text-sm font-medium">
                          {result.title ?? "Title not available"}
                        </p>
                        {result.description && (
                          <p className="text-muted-foreground text-xs line-clamp-2">
                            {result.description}
                          </p>
                        )}
                        <p className="text-muted-foreground truncate text-xs flex items-center gap-1">
                          <Globe className="size-3 shrink-0" />
                          {result.url}
                        </p>
                      </div>
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    </label>
                  ))}
                </div>

                <Button
                  type="button"
                  className="h-10 w-full rounded-full font-medium"
                  disabled={isImporting || selectedCount === 0}
                  onClick={handleImport}
                >
                  {isImporting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Importing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap className="size-4" />
                      Import {selectedCount} URL{selectedCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </Button>
              </div>
            )}

            {/* Empty state after search */}
            {hasSearched && !isSearching && searchResults.length === 0 && (
              <div className="mt-6">
                <Empty className="min-h-[200px]">
                  <EmptyHeader>
                    <EmptyMedia variant="icon-lg">
                      <CompassIcon />
                    </EmptyMedia>
                    <EmptyTitle>No results found</EmptyTitle>
                    <EmptyDescription>
                      Try a different search query to discover more content.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
