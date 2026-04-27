import { CollectionCardSkeletonGrid } from "@/components/skeletons/collection-card-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { timeAgo } from "@/helper/format";
import {
  createCollectionFn,
  deleteCollectionFn,
  listCollectionsFn,
} from "@/lib/collection";
import { createCollectionSchema } from "@/schemas/collection";
import type { CreateCollectionSchema } from "@/schemas/collection";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { FolderPlus, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/collections/")({
  component: RouteComponent,
  pendingComponent: PendingComponent,
  loader: () => listCollectionsFn(),
  head: () => ({
    meta: [
      { title: "Collections" },
      {
        name: "description",
        content: "Organize your saved items into collections.",
      },
    ],
  }),
});

function PendingComponent() {
  return (
    <div className="flex flex-1 flex-col py-7">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            <ScrambleText text="Collections" />
          </h1>
          <p className="pt-2">
            <AnimatedShinyText>
              Organize your saved items into collections
            </AnimatedShinyText>
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Create a collection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-10 w-full rounded-full" />
          </CardContent>
        </Card>
        <CollectionCardSkeletonGrid count={4} />
      </div>
    </div>
  );
}

function CreateCollectionForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCollectionSchema>({
    resolver: zodResolver(createCollectionSchema),
  });

  const onSubmit = async (data: CreateCollectionSchema) => {
    setIsSubmitting(true);
    try {
      await createCollectionFn({ data });
      toast.success("Collection created");
      reset();
      router.invalidate();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create collection",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a collection</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g. AI Reading List"
              disabled={isSubmitting}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="description"
              placeholder="What's this collection about?"
              disabled={isSubmitting}
              rows={2}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="h-10 w-full rounded-full font-medium"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Creating…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <FolderPlus className="size-4" />
                Create
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DeleteCollectionButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteCollectionFn({ data: { id } });
      toast.success(`Deleted "${name}"`);
      router.invalidate();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete collection",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
          aria-label={`Delete ${name}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this collection?</AlertDialogTitle>
          <AlertDialogDescription>
            "{name}" will be removed. The items inside will not be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RouteComponent() {
  const collections = Route.useLoaderData();

  return (
    <div className="flex flex-1 flex-col py-7">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            <ScrambleText text="Collections" />
          </h1>
          <p className="pt-2">
            <AnimatedShinyText>
              Organize your saved items into collections
            </AnimatedShinyText>
          </p>
        </div>

        <CreateCollectionForm />

        {collections.length === 0 ? (
          <Empty className="min-h-[200px]">
            <EmptyHeader>
              <EmptyMedia variant="icon-lg">
                <FolderPlus />
              </EmptyMedia>
              <EmptyTitle>No collections yet</EmptyTitle>
              <EmptyDescription>
                Create your first collection above to start grouping items.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {collections.map((collection) => (
              <Card
                key={collection.id}
                className="group relative transition-colors hover:border-primary/50"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="truncate text-base">
                      <Link
                        to="/dashboard/collections/$collectionId"
                        params={{ collectionId: collection.id }}
                        className="hover:underline"
                      >
                        {collection.name}
                      </Link>
                    </CardTitle>
                    <DeleteCollectionButton
                      id={collection.id}
                      name={collection.name}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {collection.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {collection.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {collection.itemCount} item
                      {collection.itemCount === 1 ? "" : "s"}
                    </span>
                    <span>{timeAgo(collection.updatedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
