import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setItemTagsFn } from "@/lib/collection";
import { useRouter } from "@tanstack/react-router";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  itemId: string;
  initialTags: string[];
};

export function TagEditor({ itemId, initialTags }: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(initialTags.join(", "));
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    const tags = draft
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    setIsSaving(true);
    try {
      await setItemTagsFn({ data: { id: itemId, tags } });
      toast.success("Tags updated");
      setIsEditing(false);
      router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save tags");
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setDraft(initialTags.join(", "));
    setIsEditing(false);
  }

  if (!isEditing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {initialTags.length === 0 ? (
          <span className="text-sm text-muted-foreground italic">
            No tags yet
          </span>
        ) : (
          initialTags.map((tag) => (
            <Badge key={tag} variant="default">
              {tag}
            </Badge>
          ))
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="size-3" />
          Edit tags
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="comma, separated, tags"
        className="max-w-md h-9"
        autoFocus
        disabled={isSaving}
      />
      <Button
        type="button"
        size="sm"
        onClick={handleSave}
        disabled={isSaving}
        className="gap-1.5"
      >
        {isSaving ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Check className="size-3.5" />
        )}
        Save
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={handleCancel}
        disabled={isSaving}
        className="gap-1.5"
      >
        <X className="size-3.5" />
        Cancel
      </Button>
    </div>
  );
}
