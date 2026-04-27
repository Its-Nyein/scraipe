import type { ItemSearch } from "@/schemas/item";
import { getRouteApi, useNavigate } from "@tanstack/react-router";

const route = getRouteApi("/dashboard/items/");

export function useItemsSearchParams() {
  const search = route.useSearch();
  const navigate = useNavigate({ from: "/dashboard/items/" });

  const update = (next: Partial<ItemSearch>) => {
    navigate({ search: (prev) => ({ ...prev, ...next }) });
  };

  return [search, update] as const;
}
