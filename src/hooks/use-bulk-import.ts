import {
  extractErrorMessage,
  isRateLimitMessage,
} from "@/lib/rate-limit-shared";
import { getItems } from "@/lib/scrape";
import { useState } from "react";
import { toast } from "sonner";

export type BulkImportProgress = {
  current: number;
  total: number;
};

export type BulkImportResult = {
  imported: number;
  skipped: number;
  failed: number;
  processed: Set<string>;
  stoppedReason: string | null;
};

export function useBulkImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<BulkImportProgress | null>(null);

  async function importUrls(urls: string[]): Promise<BulkImportResult> {
    setIsImporting(true);
    setProgress({ current: 0, total: urls.length });

    const result: BulkImportResult = {
      imported: 0,
      skipped: 0,
      failed: 0,
      processed: new Set(),
      stoppedReason: null,
    };

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      setProgress({ current: i + 1, total: urls.length });

      try {
        const item = await getItems({ data: { url } });
        if (item.status === "duplicate") result.skipped++;
        else if (item.status === "failed") result.failed++;
        else result.imported++;
        result.processed.add(url);
      } catch (err) {
        if (err instanceof Error && isRateLimitMessage(err.message)) {
          result.stoppedReason = extractErrorMessage(err, "Rate limit reached");
          break;
        }
        result.failed++;
        result.processed.add(url);
      }
    }

    setProgress(null);
    setIsImporting(false);
    notifyResult(result);
    return result;
  }

  return { isImporting, progress, importUrls };
}

function notifyResult(result: BulkImportResult): void {
  if (result.stoppedReason) {
    toast.error(result.stoppedReason);
    return;
  }

  const parts: string[] = [];
  if (result.imported > 0) {
    parts.push(
      `imported ${result.imported} URL${result.imported > 1 ? "s" : ""}`,
    );
  }
  if (result.skipped > 0) parts.push(`skipped ${result.skipped} already saved`);
  if (result.failed > 0) parts.push(`${result.failed} failed`);

  if (result.imported > 0) toast.success(parts.join(", "));
  else if (result.skipped > 0 && result.failed === 0)
    toast.info("All selected URLs were already in your library");
  else if (result.failed > 0) toast.error(parts.join(", "));
}
