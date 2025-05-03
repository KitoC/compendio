import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";

const GridViewLoadingSkeleton = () => {
  const isMobile = useIsMobile();

  return (
    <div className="rounded-md border">
      <div className="relative w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {Array(isMobile ? 2 : 5)
                .fill(0)
                .map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableHead>
                ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <TableRow key={i}>
                  {Array(isMobile ? 2 : 5)
                    .fill(0)
                    .map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-[100px]" />
                      </TableCell>
                    ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default GridViewLoadingSkeleton;
