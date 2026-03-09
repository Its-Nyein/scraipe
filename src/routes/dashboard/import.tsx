import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedShinyText } from "@/components/ui/magic/animated-shiny-text";
import { ScrambleText } from "@/components/ui/magic/scramble-text";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { bulkImportSchema, importSchema } from "@/schemas/import";
import type { BulkImportSchema, ImportSchema } from "@/schemas/import";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { Globe, LinkIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { getItems } from "#/lib/scrape";

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
      console.log(result);
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
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BulkImportSchema>({
    resolver: zodResolver(bulkImportSchema),
  });

  const onSubmit = async (data: BulkImportSchema) => {
    setIsLoading(true);
    try {
      // TODO: wire up bulk scrape action
      console.log("Bulk import:", data);
      toast.success("Bulk import started");
      reset();
    } catch {
      toast.error("Failed to start bulk import");
    } finally {
      setIsLoading(false);
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
            <Label htmlFor="urls">URLs</Label>
            <Input
              id="urls"
              type="url"
              placeholder="https://tanstack.com/start/latest"
              disabled={isLoading}
              className="h-10 bg-background border-border"
              {...register("urls")}
            />
            {errors.urls && (
              <p className="text-sm text-destructive">{errors.urls.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter one URL per line.
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
              placeholder="e.g. blogs, docs, toturials"
              disabled={isLoading}
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
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Importing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Globe className="size-4" />
                Import All URLs
              </span>
            )}
          </Button>
        </form>
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
