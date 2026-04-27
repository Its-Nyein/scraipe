import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CollectionCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="w-full">
            <Skeleton className="h-5 w-3/5" />
          </CardTitle>
          <Skeleton className="size-9 shrink-0 rounded-md" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CollectionCardSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: count }, (_, i) => (
        <CollectionCardSkeleton key={i} />
      ))}
    </div>
  );
}
