import React, { useMemo, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { AirtableViewProps } from "./types";
import { formatFieldValue } from "../utils";
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
import { AirtableRecord, UserPermissions } from "../types";
import { AirtableField } from "@/types/airtable";

const columnHelper = createColumnHelper<AirtableRecord>();

const getStickyStyles = (colId: string, displayFields: AirtableField[]) => {
  const isFirst = colId === displayFields[0]?.id;
  const isActions = colId === "actions";

  return isFirst
    ? "sticky left-0 bg-background shadow-sm"
    : isActions
    ? "sticky right-0 bg-background shadow-sm"
    : "";
};

interface ActionsCellProps {
  record: AirtableRecord;
  permissions: UserPermissions;
  handleEdit: (record: AirtableRecord) => void;
  setDeleteRecordId: (recordId: string) => void;
}
function ActionsCell({
  record,
  permissions,
  handleEdit,
  setDeleteRecordId,
}: ActionsCellProps) {
  return (
    <div className="flex justify-end">
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
          {permissions.update && (
            <DropdownMenuItem onClick={() => handleEdit(record)}>
              Edit
            </DropdownMenuItem>
          )}
          {permissions.delete && (
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteRecordId(record.id)}
            >
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

const GridView = ({
  table,
  isLoading,
  onRowClick,
  emptyMessage = "No records available",
  permissions,
  paginatedRecords,
  handleEdit,
  setDeleteRecordId,
}: AirtableViewProps) => {
  const isMobile = useIsMobile();
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const ROW_HEIGHT = "50px";

  const displayFields = useMemo(() => {
    if (!table || !table.fields) return [];
    let fields = table.fields.filter(
      (f) => !["createdBy", "lastModifiedBy"].includes(f.type)
    );
    const primary = table.fields.find((f) => f.id === table.primaryFieldId);
    if (primary) {
      fields = [primary, ...fields.filter((f) => f.id !== primary.id)];
    }
    return isMobile ? fields.slice(0, 2) : fields;
  }, [table, isMobile]);

  const columns = useMemo(() => {
    if (!displayFields.length) return [];

    return [
      columnHelper.accessor((row) => row.fields[displayFields[0].name], {
        id: displayFields[0].id,
        header: () => displayFields[0].name,
        cell: (info) => (
          <div className="h-full flex items-center">
            {formatFieldValue(info.getValue(), displayFields[0])}
          </div>
        ),
      }),
      ...displayFields.slice(1).map((field) =>
        columnHelper.accessor((row) => row.fields[field.name], {
          id: field.id,
          header: () => field.name,
          cell: (info) => (
            <div className="h-full flex items-center">
              {formatFieldValue(info.getValue(), field)}
            </div>
          ),
        })
      ),
      ...(permissions.update || permissions.delete
        ? [
            columnHelper.display({
              id: "actions",
              header: () => null,
              cell: ({ row }) => (
                <ActionsCell
                  record={row.original as AirtableRecord}
                  permissions={permissions}
                  handleEdit={handleEdit}
                  setDeleteRecordId={setDeleteRecordId}
                />
              ),
            }),
          ]
        : []),
    ];
  }, [displayFields, permissions, handleEdit, setDeleteRecordId]);

  const tableInstance = useReactTable({
    data: paginatedRecords,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
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
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="relative w-full overflow-auto" ref={tableContainerRef}>
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
                        displayFields
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
                  onClick={() => onRowClick(row.original)}
                  style={{
                    animationDelay: `${rowIndex * 30}ms`,
                    height: ROW_HEIGHT,
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <TableCell
                        key={cell.id}
                        className={`whitespace-nowrap align-middle p-2 ${getStickyStyles(
                          cell.column.id,
                          displayFields
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
    </div>
  );
};

export default GridView;
