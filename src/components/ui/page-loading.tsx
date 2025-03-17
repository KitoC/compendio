
import { Skeleton } from "@/components/ui/skeleton";

export function PageLoading() {
  return (
    <div className="w-full p-6 space-y-6 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-24" />
      </div>
      
      {/* Content skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      
      {/* Card-like skeleton */}
      <div className="space-y-6">
        <div className="border rounded-lg p-4 space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <div className="flex justify-end space-x-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        
        <div className="border rounded-lg p-4 space-y-4">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-16 w-full" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
