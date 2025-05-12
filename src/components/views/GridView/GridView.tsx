import { useMemo, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  createColumnHelper,
  CellContext,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Loader from "@/components/ui/loader";
import { UserPermissions } from "@/types/user";
import { BaseService, ServiceQuery } from "@/services/supabase/BaseService";
import ActionsCell from "./ActionCell";
import { getFieldRenderer } from "@/components/custom-tables/field-renderers";
import { Skeleton } from "@/components/ui/skeleton";
import { FieldType } from "@/types/fieldTypes";

export interface SelectOption {
  label: string;
  value: string;
  color?: string;
}

export interface TableQuery {
  page: number;
  pageSize: number;
  search: string;
}

export interface GridViewColumn<RecordType> {
  id: string;
  header: string;
  type: FieldType;
  accessorKey: string;
  cell: (info: CellContext<RecordType, unknown>) => React.ReactNode;
  options?: SelectOption[];
}

export interface GridViewActions<RecordType> {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: (record: RecordType) => void;
  disabled?: (record: RecordType) => boolean;
}

export interface GridViewProps<RecordType> {
  service: BaseService;
  permissions?: UserPermissions;
  emptyMessage?: string;
  columns: GridViewColumn<RecordType>[];
  actions?: GridViewActions<RecordType>[];
  data: RecordType[];
  isLoading: boolean;
  isFetching: boolean;
  setQuery: React.Dispatch<React.SetStateAction<ServiceQuery>>;
  query: ServiceQuery;
  count: number;
}

const GridView = <RecordType extends Record<string, unknown>>({
  emptyMessage,
  columns,
  actions,
  data,
  isLoading,
  isFetching,
  setQuery,
  query,
  count,
}: GridViewProps<RecordType>) => {
  const columnHelper = useMemo(() => createColumnHelper<RecordType>(), []);
  const { page, pageSize } = query?.pagination || {};

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const ROW_HEIGHT = "50px";

  const formattedColumns = useMemo(() => {
    const formattedCols = columns.map((column) =>
      columnHelper.display({
        id: column.id,
        cell: (info) =>
          getFieldRenderer(column, info.getValue(), info.row.original),
      })
    );

    if (actions?.length) {
      columnHelper.display({
        id: "actions",
        header: () => null,
        cell: ({ row }) => <ActionsCell actions={actions} row={row} />,
      });
    }
    return formattedCols;
  }, [columns, actions, columnHelper]);

  const tableInstance = useReactTable({
    data,
    columns: formattedColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      columnPinning: {
        left: [columns[0].id],
        right: ["actions-column"],
      },
    },
  });

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
        {isFetching && (
          <Loader2 className="mr-3 w-4 h-4 animate-spin absolute right-0" />
        )}
      </div>

      {isLoading && <GridViewLoadingSkeleton />}
      {!isLoading && (
        <div
          className="relative w-full rounded-md border overflow-hidden h-full bg-muted"
          ref={tableContainerRef}
        >
          {isFetching && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-40 bg-background/75 animate-fade-in">
              <Loader className="w-4 h-4" />
            </div>
          )}

          <Table className="border-b border-border bg-white">
            <TableHeader className="[&_tr]:border-b-transparent">
              {tableInstance.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-b border-border "
                >
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className={`cursor-pointer whitespace-nowrap ${getStickyStyles<RecordType>(
                          header.id,
                          columns,
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
                    // onClick={() => onEdit(row.original)}
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
                          className={`whitespace-nowrap align-middle p-2 ${getStickyStyles<RecordType>(
                            cell.column.id,
                            columns,
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
      )}

      <div className="flex items-center justify-end space-x-2 py-2 px-4 bg-background border border-border rounded-md">
        {isLoading && <Skeleton className="w-24 h-8 bg-muted-darker" />}
        {!isLoading && (
          <>
            <div className="text-sm text-muted-foreground">
              {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, count)} of{" "}
              {count}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setQuery((prev) => ({
                    ...prev,
                    pagination: {
                      page: page - 1,
                      pageSize: pageSize,
                    },
                  }))
                }
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setQuery((prev) => ({
                    ...prev,
                    pagination: {
                      page: page + 1,
                      pageSize: pageSize,
                    },
                  }))
                }
                disabled={isFetching || page * pageSize >= count}
              >
                {isFetching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GridView;
