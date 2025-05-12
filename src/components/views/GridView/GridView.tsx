import { useMemo, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
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
import { getFieldRenderer } from "@/components/field-renderers";
import { Skeleton } from "@/components/ui/skeleton";
import { SelectOption, FieldRenderOptions } from "@/types/fieldTypes";
import { cn } from "@/lib/utils";
import { GenericTable } from "@supabase/supabase-js/dist/module/lib/types";

export interface TableQuery {
  page: number;
  pageSize: number;
  search: string;
}

export interface GridViewColumn<RecordType> {
  id: string;
  header: string;
  renderOptions: FieldRenderOptions;
  accessorKey?: string;
  accessorFn?: (row: RecordType) => string;
  cell?: (info: CellContext<RecordType, unknown>) => React.ReactNode;
  options?: SelectOption[];
}

export interface GridViewActions<RecordType> {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: (record: RecordType) => void;
  disabled?: (record: RecordType) => boolean;
}

export interface GridViewProps<
  Table extends GenericTable,
  RecordType extends Table["Row"] = Table["Row"]
> {
  // @ts-expect-error TODO: Fix this typing
  service: BaseService<Table>;
  permissions?: UserPermissions;
  emptyMessage?: string | React.ReactNode;
  columns: GridViewColumn<RecordType>[];
  actions?: GridViewActions<RecordType>[];
  data: RecordType[];
  isLoading: boolean;
  isFetching: boolean;
  setQuery: React.Dispatch<React.SetStateAction<ServiceQuery>>;
  query: ServiceQuery;
  count: number;
}

const GridView = <
  Table extends GenericTable,
  RecordType extends Table["Row"] = Table["Row"]
>({
  emptyMessage,
  columns,
  actions,
  data,
  isLoading,
  isFetching,
  setQuery,
  query,
  count,
}: GridViewProps<Table, RecordType>) => {
  const columnHelper = useMemo(() => createColumnHelper<RecordType>(), []);
  const { page, pageSize } = query?.pagination || {};

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const ROW_HEIGHT = "50px";

  const formattedColumns = useMemo(() => {
    const formattedCols = columns.map((column) =>
      columnHelper.display({
        id: column.id,
        ...column,
        cell: (info) => {
          return getFieldRenderer(
            column.renderOptions,
            info.getValue(),
            info.row.original
          );
        },
      })
    );

    if (actions?.length) {
      formattedCols.push(
        columnHelper.display({
          id: "actions",
          header: () => null,
          cell: ({ row }) => <ActionsCell actions={actions} row={row} />,
          size: 40,
          maxSize: 40,
        })
      );
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
        right: ["actions"],
      },
    },
  });

  return (
    <div className="flex flex-col gap-3 max-h-full p-1 flex-grow">
      <div className="flex items-center justify-end w-full relative">
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
          className="relative w-full rounded-md border overflow-hidden h-full bg-muted flex flex-col"
          ref={tableContainerRef}
        >
          {isFetching && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-40 bg-background/75 animate-fade-in">
              <Loader className="w-4 h-4" />
            </div>
          )}

          <Table
            className={cn("border-b border-border bg-white", {
              "h-full": !tableInstance.getRowModel().rows.length,
            })}
          >
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
                        style={{
                          width: header.id === "actions" ? "40px" : "auto",
                          maxWidth: header.id === "actions" ? "40px" : "auto",
                        }}
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
            <TableBody className="h-full overflow-auto relative">
              {tableInstance.getRowModel().rows.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background">
                  {emptyMessage}
                </div>
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
                          style={{
                            width: cell.id === "actions" ? "40px" : "auto",
                            maxWidth: cell.id === "actions" ? "40px" : "auto",
                          }}
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

      <div className="flex items-center justify-end space-x-2 py-2 px-4">
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
