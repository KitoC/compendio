import { useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { CustomTableViewProps } from "../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import getStickyStyles from "./util/getStickyStyles";
import GridViewLoadingSkeleton from "./GridViewLoadingSkeleton";
import useColumns from "./hooks/useColumns";
import { useDataViewContext } from "@/contexts/DataViewProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Loader from "@/components/ui/loader";

const GridView = ({
  table,
  emptyMessage = "No records available",
  permissions,
}: CustomTableViewProps) => {
  const {
    data,
    isLoadingData,
    onEdit,
    query,
    total,
    isFetchingData,
    setQuery,
  } = useDataViewContext();

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const ROW_HEIGHT = "50px";

  const { columns, displayFields } = useColumns(table, permissions);

  const tableInstance = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      columnPinning: {
        left: [displayFields[0].id],
        right: ["actions-column"],
      },
    },
  });

  if (isLoadingData) {
    return <GridViewLoadingSkeleton />;
  }

  return (
    <div className="flex flex-col gap-2 max-h-full p-1">
      <div className="flex items-center justify-end w-1/3 relative">
        <Input
          icon={<Search className="w-4 h-4" />}
          placeholder="Search"
          className="w-full"
          value={query.search}
          onChange={(e) => {
            setQuery((prev) => ({
              ...prev,
              search: e.target.value,
            }));
          }}
        />
        {isFetchingData && (
          <Loader2 className="mr-3 w-4 h-4 animate-spin absolute right-0" />
        )}
      </div>

      <div
        className="relative w-full rounded-md border overflow-hidden h-full bg-muted"
        ref={tableContainerRef}
      >
        {isFetchingData && (
          <div className="absolute inset-0 flex items-center justify-center z-40 bg-background/75 animate-fade-in">
            <Loader className="w-4 h-4" />
          </div>
        )}
        <Table className="border-b border-border bg-white">
          <TableHeader className="[&_tr]:border-b-transparent">
            {tableInstance.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={`cursor-pointer whitespace-nowrap ${getStickyStyles(
                        header.id,
                        displayFields,
                        true
                      )}`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center space-x-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getIsSorted() && (
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="flex-grow overflow-auto">
            {tableInstance.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              tableInstance.getRowModel().rows.map((row, rowIndex) => (
                <TableRow
                  key={row.id}
                  className="animate-fade-in transition-colors cursor-pointer hover:bg-muted/50"
                  onClick={() => onEdit(row.original)}
                  style={{
                    animationDelay: `${rowIndex * 30}ms`,
                    height: ROW_HEIGHT,
                    maxHeight: ROW_HEIGHT,
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <TableCell
                        key={cell.id}
                        className={`whitespace-nowrap align-middle p-2 ${getStickyStyles(
                          cell.column.id,
                          displayFields,
                          false
                        )}`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-2 px-4 bg-background border border-border rounded-md">
        <div className="text-sm text-muted-foreground">
          {(query.page - 1) * query.pageSize + 1}-
          {Math.min(query.page * query.pageSize, total)} of {total}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setQuery((prev) => ({
                ...prev,
                page: prev.page - 1,
              }))
            }
            disabled={query.page === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setQuery((prev) => ({
                ...prev,
                page: prev.page + 1,
              }))
            }
            disabled={isFetchingData || query.page * query.pageSize >= total}
          >
            {isFetchingData ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GridView;
