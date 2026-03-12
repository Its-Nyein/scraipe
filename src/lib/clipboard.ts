import { createClientOnlyFn } from "@tanstack/react-start";
import { toast } from "sonner";

export const copyToClipboardFn = createClientOnlyFn(async (url: string) => {
  await navigator.clipboard.writeText(url);
  toast.success("Copied to clipboard", {
    id: "copy-to-clipboard",
  });

  return;
});
