import { useMemo, useState } from "react";

export type UrlItem = { url: string };

export function useUrlSelection<T extends UrlItem>() {
  const [items, setItems] = useState<T[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [existingUrls, setExistingUrls] = useState<Set<string>>(new Set());

  const selectableCount = useMemo(
    () => items.filter((item) => !existingUrls.has(item.url)).length,
    [items, existingUrls],
  );

  const selectedCount = selectedUrls.size;
  const allSelected = selectableCount > 0 && selectedCount === selectableCount;
  const isExisting = (url: string) => existingUrls.has(url);

  function setResults(nextItems: T[], existing: string[]) {
    const existingSet = new Set(existing);
    setItems(nextItems);
    setExistingUrls(existingSet);
    setSelectedUrls(
      new Set(
        nextItems.map((item) => item.url).filter((url) => !existingSet.has(url)),
      ),
    );
  }

  function toggleUrl(url: string, checked: boolean) {
    if (existingUrls.has(url)) return;
    setSelectedUrls((previous) => {
      const next = new Set(previous);
      if (checked) next.add(url);
      else next.delete(url);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedUrls(new Set());
      return;
    }
    setSelectedUrls(
      new Set(
        items.map((item) => item.url).filter((url) => !existingUrls.has(url)),
      ),
    );
  }

  function getSelectedUrls(): string[] {
    return items
      .filter((item) => selectedUrls.has(item.url))
      .map((item) => item.url);
  }

  function commitProcessed(processed: Set<string>) {
    setItems((previous) => previous.filter((item) => !processed.has(item.url)));
    setExistingUrls((previous) => {
      const next = new Set(previous);
      for (const url of processed) next.add(url);
      return next;
    });
    setSelectedUrls((previous) => {
      const next = new Set(previous);
      for (const url of processed) next.delete(url);
      return next;
    });
  }

  return {
    items,
    selectedCount,
    selectableCount,
    allSelected,
    isExisting,
    isSelected: (url: string) => selectedUrls.has(url),
    existingCount: existingUrls.size,
    setResults,
    toggleUrl,
    toggleSelectAll,
    getSelectedUrls,
    commitProcessed,
  };
}
