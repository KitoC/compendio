import React, { useMemo, useRef, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  createColumnHelper,
} from "@tanstack/react-table";
import { ArrowUpDown, LucideProps, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const getStickyStyles = <T extends object>(
  colId: string,
  columns: DataGridColumn<T>[]
) => {
  const isFirst = colId === columns[0]?.id;
  const isActions = colId === "actions";

  return isFirst
    ? "sticky left-0 bg-background shadow-sm"
    : isActions
    ? "sticky right-0 bg-background shadow-sm w-[50px]"
    : "";
};

export interface GridAction {
  label: string;
  onClick?: (record: unknown, e: React.MouseEvent<HTMLDivElement>) => void;
  onConfirm?: (record: unknown, e: React.MouseEvent<HTMLButtonElement>) => void;
  onConfirmText?: string;
  onConfirmTitle?: string;
  onConfirmDescription?: string;
  Icon?: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  hidden: boolean;
}

export interface ActionsCellProps {
  record: unknown;
  actions: GridAction[];
  setIsConfirmingAction: (action: { label: string; record: unknown }) => void;
}

export type DataGridColumn<T> = ColumnDef<T> & {
  accessorKey?: string;
  accessorFn?: (row: T) => string | number;
  render?: (row: T) => React.ReactNode;
  field?: string;
  header?: string;
  hidden?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
};

export interface DataGridProps<T extends object> {
  columns: DataGridColumn<T>[];
  isLoading: boolean;
  onRowClick?: (record: T) => void;
  emptyMessage?: string;
  permissions?: unknown;
  actions?: GridAction[];
  data: T[];
}

function ActionsCell({
  record,
  actions,
  setIsConfirmingAction,
}: ActionsCellProps) {
  return (
    <>
      <div className="flex justify-end w-fit">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {actions
              .filter((action) => !action.hidden)
              .map((action) => (
                <DropdownMenuItem
                  key={action.label}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (action.onConfirm) {
                      setIsConfirmingAction({
                        label: action.label,
                        record,
                      });
                    } else {
                      action.onClick(record, e);
                    }
                  }}
                >
                  {action.Icon && <action.Icon className="mr-2 h-4 w-4" />}
                  {action.label}
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

const DataGrid = <T extends object>({
  columns = [],
  isLoading,
  onRowClick,
  emptyMessage = "No records available",
  actions = [],
  data,
}: DataGridProps<T>) => {
  const isMobile = useIsMobile();
  const ROW_HEIGHT = "50px";

  const [isConfirmingAction, setIsConfirmingAction] = useState<{
    label: string;
    record: unknown;
  } | null>(null);
  const [isConfirmingActionLoading, setIsConfirmingActionLoading] =
    useState<boolean>(false);

  const confirmationAction = actions.find((action) => action.onConfirm) as
    | GridAction
    | undefined;

  const mutatedColumns = useMemo(() => {
    const COLUMNS: DataGridColumn<T>[] = [
      ...columns.map((col) => {
        const { render, field } = col;
        const COLUMN = {
          accessorKey: field,
          ...col,
        };
        if (render) {
          COLUMN.cell = ({ row }) => render(row.original);
        }
        return COLUMN;
      }),
    ];

    if (actions?.length) {
      COLUMNS.push({
        size: 50,
        id: "actions",
        // header: () => null,
        cell: ({ row }) => (
          <ActionsCell
            record={row.original as unknown}
            actions={actions}
            setIsConfirmingAction={setIsConfirmingAction}
          />
        ),
      });
    }

    return COLUMNS;
  }, [columns, actions]);

  const tableInstance = useReactTable({
    data,
    columns: mutatedColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return (
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
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          {tableInstance.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    className={`cursor-pointer whitespace-nowrap ${getStickyStyles(
                      header.id,
                      mutatedColumns
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
        <TableBody>
          {tableInstance.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            tableInstance.getRowModel().rows.map((row, rowIndex) => (
              <TableRow
                key={row.id}
                className="animate-fade-in transition-colors cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  onRowClick(row.original);
                }}
                style={{
                  animationDelay: `${rowIndex * 30}ms`,
                  height: ROW_HEIGHT,
                }}
              >
                {row.getVisibleCells().map((cell) => {
                  return (
                    <TableCell
                      key={cell.id}
                      onClick={(e) => {
                        if (cell.column.id === "actions") {
                          e.stopPropagation();
                        }
                      }}
                      className={`whitespace-nowrap align-middle p-2 ${getStickyStyles(
                        cell.column.id,
                        mutatedColumns
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

      {actions.length && isConfirmingAction && (
        <AlertDialog
          open={isConfirmingAction?.label === confirmationAction?.label}
        >
          <AlertDialogContent className="animate-fade-in">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmationAction?.onConfirmTitle || "Confirm"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmationAction?.onConfirmDescription ||
                  "This action cannot be undone. This will permanently delete this item."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={isConfirmingActionLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsConfirmingAction(null);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={isConfirmingActionLoading}
                onClick={async (e) => {
                  e.stopPropagation();
                  setIsConfirmingActionLoading(true);
                  await confirmationAction?.onConfirm(
                    isConfirmingAction?.record,
                    e
                  );
                  setIsConfirmingActionLoading(false);
                  setIsConfirmingAction(null);
                }}
              >
                {isConfirmingActionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  confirmationAction?.onConfirmText || "Confirm"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export default DataGrid;
