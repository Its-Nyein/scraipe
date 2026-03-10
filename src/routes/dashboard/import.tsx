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
import { bulkScrapeUrlsFn, getItems, mapUrlFn } from "@/lib/scrape";
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
      await getItems({ data });
      toast.success("URL imported successfully");
      reset();
    } catch {
      toast.error("Failed to import URL");
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
      setUrls(result);
      setSelectedUrls(new Set(result.map((item) => item.url)));
      toast.success("Bulk URLs mapped successfully");
      reset();
    } catch {
      toast.error("Failed to map bulk URLs");
    } finally {
      setIsMapping(false);
    }
  };

  const selectedCount = selectedUrls.size;
  const hasSelectedUrls = selectedCount > 0;
  const allSelected = urls.length > 0 && selectedCount === urls.length;

  const toggleUrlSelection = (url: string, checked: boolean) => {
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
    setSelectedUrls(new Set(urls.map((item) => item.url)));
  };

  const handleImportSelected = async () => {
    if (!hasSelectedUrls) return;
    setIsImporting(true);
    try {
      const selectedList = urls
        .filter((item) => selectedUrls.has(item.url))
        .map((item) => item.url);

      await bulkScrapeUrlsFn({
        data: {
          urls: selectedList,
        },
      });

      toast.success(
        `Imported ${selectedList.length} selected URL${selectedList.length > 1 ? "s" : ""}`,
      );
      setUrls((previous) =>
        previous.filter((item) => !selectedUrls.has(item.url)),
      );
      setSelectedUrls(new Set());
    } catch {
      toast.error("Failed to import selected URLs");
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
                {selectedCount}/{urls.length} selected
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
              {urls.map((url, index) => (
                <label
                  key={`${url.url}-${index}`}
                  className="hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-md p-2 transition-colors"
                >
                  <Checkbox
                    id={`${url.url}-${index}`}
                    className="mt-0.5"
                    checked={selectedUrls.has(url.url)}
                    onCheckedChange={(checked) =>
                      toggleUrlSelection(url.url, checked === true)
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {url.title ?? "Title is not available"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {url.description ?? "Description is not available"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {url.url}
                    </p>
                  </div>
                </label>
              ))}
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
