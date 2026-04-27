import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ItemCardSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="space-y-3 px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-5 w-3/5" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          <Skeleton className="h-3 w-20" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-12 rounded-md" />
            <Skeleton className="h-4 w-12 rounded-md" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ItemCardSkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </div>
  );
}
