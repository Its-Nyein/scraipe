import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  addItemsToCollectionFn,
  removeItemsFromCollectionFn,
} from "@/lib/collection";
import { Link, useRouter } from "@tanstack/react-router";
import { FolderPlus, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Collection = { id: string; name: string };

type Props = {
  itemId: string;
  allCollections: Collection[];
  itemCollections: Collection[];
};

export function CollectionsPicker({
  itemId,
  allCollections,
  itemCollections,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const memberSet = new Set(itemCollections.map((c) => c.id));

  async function toggle(collectionId: string, isMember: boolean) {
    setPending(collectionId);
    try {
      if (isMember) {
        await removeItemsFromCollectionFn({
          data: { collectionId, itemIds: [itemId] },
        });
        toast.success("Removed from collection");
      } else {
        await addItemsToCollectionFn({
          data: { collectionId, itemIds: [itemId] },
        });
        toast.success("Added to collection");
      }
      router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPending(null);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FolderPlus className="size-4" />
          {itemCollections.length > 0
            ? `In ${itemCollections.length} collection${itemCollections.length > 1 ? "s" : ""}`
            : "Add to collection"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Collections</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {allCollections.length === 0 ? (
          <div className="px-2 py-3 text-xs text-muted-foreground">
            No collections yet.{" "}
            <Link
              to="/dashboard/collections"
              className="text-primary hover:underline"
            >
              Create one
            </Link>
            .
          </div>
        ) : (
          allCollections.map((collection) => {
            const isMember = memberSet.has(collection.id);
            return (
              <DropdownMenuCheckboxItem
                key={collection.id}
                checked={isMember}
                disabled={pending === collection.id}
                onSelect={(event) => {
                  event.preventDefault();
                  toggle(collection.id, isMember);
                }}
              >
                <span className="flex-1 truncate">{collection.name}</span>
                {pending === collection.id && (
                  <Loader2 className="size-3 animate-spin" />
                )}
              </DropdownMenuCheckboxItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
