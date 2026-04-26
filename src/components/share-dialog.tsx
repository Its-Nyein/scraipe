import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toggleShareFn } from "@/lib/share";
import { useRouter } from "@tanstack/react-router";
import { Check, Copy, Download, Loader2, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  itemId: string;
  title: string | null;
  content: string | null;
  isPublic: boolean;
  shareSlug: string | null;
};

export function ShareDialog({
  itemId,
  title,
  content,
  isPublic,
  shareSlug,
}: Props) {
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  const shareUrl =
    shareSlug && typeof window !== "undefined"
      ? `${window.location.origin}/share/${shareSlug}`
      : null;

  async function handleToggle() {
    setIsToggling(true);
    try {
      await toggleShareFn({ data: { id: itemId, isPublic: !isPublic } });
      toast.success(isPublic ? "Sharing disabled" : "Sharing enabled");
      router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setIsToggling(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  function handleDownloadMarkdown() {
    if (!content) {
      toast.error("No content available to export");
      return;
    }
    const safeTitle =
      (title ?? "scraipe-item")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "scraipe-item";

    const body = title ? `# ${title}\n\n${content}` : content;
    const blob = new Blob([body], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeTitle}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="size-4" />
          Share
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Share this item</SheetTitle>
          <SheetDescription>
            Make this item public to share it via a link, or export it as
            Markdown.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 py-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Public link</Label>
                <p className="text-xs text-muted-foreground">
                  {isPublic
                    ? "Anyone with the link can view this item."
                    : "Only you can see this item."}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant={isPublic ? "outline" : "default"}
                onClick={handleToggle}
                disabled={isToggling}
                className="shrink-0"
              >
                {isToggling ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : isPublic ? (
                  "Disable"
                ) : (
                  "Enable"
                )}
              </Button>
            </div>

            {isPublic && shareUrl && (
              <div className="flex items-center gap-2 pt-1">
                <Input
                  readOnly
                  value={shareUrl}
                  className="text-xs"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="shrink-0 gap-1.5"
                >
                  {justCopied ? (
                    <>
                      <Check className="size-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Export</Label>
              <p className="text-xs text-muted-foreground">
                Download this item as Markdown.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadMarkdown}
              disabled={!content}
              className="gap-1.5"
            >
              <Download className="size-3.5" />
              Download .md
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
