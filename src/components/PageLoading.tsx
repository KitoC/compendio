
import { Skeleton } from "@/components/ui/skeleton";

const PageLoading = () => {
  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <Skeleton className="h-12 w-48 mb-6" />
      
      <div className="grid gap-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
};

export default PageLoading;
