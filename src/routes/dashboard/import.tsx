import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedShinyText } from "@/components/ui/magic/animated-shiny-text";
import { ScrambleText } from "@/components/ui/magic/scramble-text";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  bulkScrapeUrlsFn,
  checkExistingUrlsFn,
  getItems,
  mapUrlFn,
} from "@/lib/scrape";
import { extractErrorMessage } from "@/lib/rate-limit-shared";
import type { BulkImportSchema, ImportSchema } from "@/schemas/import";
import { bulkImportSchema, importSchema } from "@/schemas/import";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SearchResultWeb } from "@mendable/firecrawl-js";
import { createFileRoute } from "@tanstack/react-router";
import { Globe, LinkIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/import")({
  component: RouteComponent,
});

function SingleUrlForm() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ImportSchema>({
    resolver: zodResolver(importSchema),
  });

  const onSubmit = async (data: ImportSchema) => {
    setIsLoading(true);
    try {
      const result = await getItems({ data });
      if (result.status === "duplicate") {
        toast.info("This URL is already in your library");
      } else if (result.status === "failed") {
        toast.error("Failed to import URL");
      } else {
        toast.success("URL imported successfully");
        reset();
      }
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to import URL"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Single URL</CardTitle>
        <CardDescription>
          Scrape and save content from any web page into your knowledge base.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://tanstack.com/start/latest"
              disabled={isLoading}
              className="h-10 bg-background border-border"
              {...register("url")}
            />
            {errors.url && (
              <p className="text-sm text-destructive">{errors.url.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="h-10 w-full rounded-full font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Importing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LinkIcon className="size-4" />
                Import URL
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function BulkUrlForm() {
  const [isMapping, setIsMapping] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [urls, setUrls] = useState<SearchResultWeb[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [existingUrls, setExistingUrls] = useState<Set<string>>(new Set());

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BulkImportSchema>({
    resolver: zodResolver(bulkImportSchema),
  });

  const onSubmit = async (data: BulkImportSchema) => {
    setIsMapping(true);
    try {
      const result = await mapUrlFn({ data });
      const mappedUrls = result.map((item) => item.url);

      const { existingUrls: existing } = await checkExistingUrlsFn({
        data: { urls: mappedUrls },
      });
      const existingSet = new Set(existing);

      setUrls(result);
      setExistingUrls(existingSet);
      setSelectedUrls(
        new Set(mappedUrls.filter((url) => !existingSet.has(url))),
      );
      toast.success("Bulk URLs mapped successfully");
      reset();
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to map bulk URLs"));
    } finally {
      setIsMapping(false);
    }
  };

  const selectedCount = selectedUrls.size;
  const hasSelectedUrls = selectedCount > 0;
  const selectableCount = urls.filter(
    (item) => !existingUrls.has(item.url),
  ).length;
  const allSelected = selectableCount > 0 && selectedCount === selectableCount;

  const toggleUrlSelection = (url: string, checked: boolean) => {
    if (existingUrls.has(url)) return;
    setSelectedUrls((previous) => {
      const next = new Set(previous);
      if (checked) {
        next.add(url);
      } else {
        next.delete(url);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedUrls(new Set());
      return;
    }
    setSelectedUrls(
      new Set(
        urls.map((item) => item.url).filter((url) => !existingUrls.has(url)),
      ),
    );
  };

  const handleImportSelected = async () => {
    if (!hasSelectedUrls) return;
    setIsImporting(true);
    try {
      const selectedList = urls
        .filter((item) => selectedUrls.has(item.url))
        .map((item) => item.url);

      const result = await bulkScrapeUrlsFn({
        data: {
          urls: selectedList,
        },
      });

      if (result.imported > 0 && result.skipped > 0) {
        toast.success(
          `Imported ${result.imported}, skipped ${result.skipped} already saved`,
        );
      } else if (result.imported > 0) {
        toast.success(
          `Imported ${result.imported} URL${result.imported > 1 ? "s" : ""}`,
        );
      } else {
        toast.info("All selected URLs were already in your library");
      }

      setUrls((previous) =>
        previous.filter((item) => !selectedUrls.has(item.url)),
      );
      setExistingUrls((previous) => {
        const next = new Set(previous);
        for (const url of selectedList) next.add(url);
        return next;
      });
      setSelectedUrls(new Set());
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to import selected URLs"));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Bulk URLs</CardTitle>
        <CardDescription>
          Discover and save content from multiple pages at once.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="urls">URL</Label>
            <Input
              id="urls"
              type="url"
              placeholder="https://tanstack.com/start/latest"
              disabled={isMapping}
              className="h-10 bg-background border-border"
              {...register("urls")}
            />
            {errors.urls && (
              <p className="text-sm text-destructive">{errors.urls.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter a root URL to discover related pages.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="search">
              Filter{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="search"
              type="text"
              placeholder="e.g. blogs, docs, tutorials"
              disabled={isMapping}
              className="h-10 bg-background border-border"
              {...register("search")}
            />
            {errors.search && (
              <p className="text-sm text-destructive">
                {errors.search.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="h-10 w-full rounded-full font-medium"
            disabled={isMapping}
          >
            {isMapping ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Mapping...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Globe className="size-4" />
                Map URLs
              </span>
            )}
          </Button>
        </form>

        {urls.length > 0 && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">
                {selectedCount}/{selectableCount} selected
                {existingUrls.size > 0 && (
                  <span className="ml-2 text-xs">
                    ({existingUrls.size} already saved)
                  </span>
                )}
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
            <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-border p-2">
              {urls.map((url, index) => {
                const isExisting = existingUrls.has(url.url);
                return (
                  <label
                    key={`${url.url}-${index}`}
                    className={
                      isExisting
                        ? "flex items-start gap-3 rounded-md p-2 opacity-60"
                        : "hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-md p-2 transition-colors"
                    }
                  >
                    <Checkbox
                      id={`${url.url}-${index}`}
                      className="mt-0.5"
                      checked={selectedUrls.has(url.url)}
                      disabled={isExisting}
                      onCheckedChange={(checked) =>
                        toggleUrlSelection(url.url, checked === true)
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {url.title ?? "Title is not available"}
                        </p>
                        {isExisting && (
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Saved
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {url.description ?? "Description is not available"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {url.url}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
            <Button
              type="button"
              className="h-10 w-full rounded-full font-medium"
              disabled={isImporting || !hasSelectedUrls}
              onClick={handleImportSelected}
            >
              {isImporting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Importing selected URLs...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LinkIcon className="size-4" />
                  Import selected URLs
                </span>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RouteComponent() {
  return (
    <div className="flex flex-1 items-center justify-center py-7">
      <div className="w-full max-w-2xl space-y-6 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            <ScrambleText text="Import" />
          </h1>
          <p className="pt-2">
            <AnimatedShinyText>
              Save your favorite websites to your knowledge base
            </AnimatedShinyText>
          </p>
        </div>

        <Tabs defaultValue="single">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" className="gap-2">
              <LinkIcon className="size-4" />
              Single URL
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-2">
              <Globe className="size-4" />
              Bulk URLs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <SingleUrlForm />
          </TabsContent>
          <TabsContent value="bulk">
            <BulkUrlForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
