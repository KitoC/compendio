// NO_CHANGE

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Download,
} from "lucide-react";
import TableActions from "./TableActions";
import Pagination from "./Pagination";
import EditModal from "./EditModal";
import { Column, DataTableProps, UserPermissions } from "./types";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

// Default permissions
const defaultPermissions: UserPermissions = {
  create: true,
  read: true,
  update: true,
  delete: true,
  export: true,
};

function DataTable<T extends Record<string, unknown>>({
  data,
  idField = "id" as keyof T,
  columns: providedColumns,
  permissions: providedPermissions,
  title = "Data Table",
  subtitle,
  searchable = true,
  pagination = true,
  pageSize = 10,
  onRowClick,
  onUpdate,
  onCreate,
  onDelete,
  isLoading = false,
  emptyMessage = "No data available",
  className,
}: DataTableProps<T>) {
  const isMobile = useIsMobile();

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | number | null>(
    null
  );

  // Merge provided permissions with defaults
  const permissions: UserPermissions = {
    ...defaultPermissions,
    ...providedPermissions,
  };

  // Auto-generate columns if not provided
  const columns = useMemo(() => {
    if (providedColumns) return providedColumns;

    if (data.length === 0) return [];

    // Generate columns from the first data item
    const sample = data[0];
    return Object.keys(sample).map((key) => ({
      field: key as keyof T,
      header:
        key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1"),
      sortable: true,
      filterable: true,
      hidden: key === "id" || key.includes("Id") || key.includes("_id"),
    }));
  }, [data, providedColumns]);

  // Reset pagination when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  // Handle search and filtering
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    const searchLower = searchTerm.toLowerCase();
    return data.filter((item) => {
      return columns.some((column) => {
        const value = item[column.field as keyof T];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchLower);
      });
    });
  }, [data, searchTerm, columns]);

  // Handle sorting
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === null || aValue === undefined)
        return sortDirection === "asc" ? -1 : 1;
      if (bValue === null || bValue === undefined)
        return sortDirection === "asc" ? 1 : -1;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === "asc"
        ? aValue > bValue
          ? 1
          : -1
        : aValue > bValue
        ? -1
        : 1;
    });
  }, [filteredData, sortField, sortDirection]);

  // Handle pagination
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  // Handle sorting toggle
  const handleSort = (field: keyof T) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Handle edit
  const handleEdit = (item: T) => {
    setEditingItem(item);
    setIsCreating(false);
  };

  // Handle create
  const handleCreate = () => {
    setEditingItem(null);
    setIsCreating(true);
  };

  // Handle save (create or update)
  const handleSave = async (updatedItem: T) => {
    try {
      if (isCreating) {
        if (onCreate) {
          await onCreate(updatedItem);
        }
      } else {
        if (onUpdate) {
          await onUpdate(updatedItem);
        }
      }
    } catch (error) {
      console.error("Error saving item:", error);
      throw error;
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (deleteItemId !== null && onDelete) {
      try {
        await onDelete(deleteItemId);
        toast.success("Item deleted successfully");
      } catch (error) {
        console.error("Error deleting item:", error);
        toast.error("Failed to delete item");
      } finally {
        setDeleteItemId(null);
      }
    }
  };

  // Handle export
  const handleExport = () => {
    if (!permissions.export) return;

    try {
      const headers = columns
        .filter((col) => !col.hidden)
        .map((col) => col.header);

      const csvRows = [headers.join(",")];

      for (const item of sortedData) {
        const values = columns
          .filter((col) => !col.hidden)
          .map((col) => {
            const value = item[col.field as keyof T];
            return value !== null && value !== undefined
              ? `"${String(value).replace(/"/g, '""')}"`
              : "";
          });
        csvRows.push(values.join(","));
      }

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${title.replace(/\s+/g, "_")}_export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Export completed");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  };

  // Filter columns based on screen size
  const visibleColumns = useMemo(() => {
    if (!isMobile) return columns.filter((col) => !col.hidden);

    // On mobile, show fewer columns
    return columns.filter((col) => !col.hidden).slice(0, 2); // Show only the first 2 columns on mobile
  }, [columns, isMobile]);

  // Render loading skeletons
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-10 w-[250px]" />
              <Skeleton className="h-10 w-[100px]" />
            </div>
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
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            {subtitle && <CardDescription>{subtitle}</CardDescription>}
          </div>
          <div className="flex space-x-2">
            {permissions.create && (
              <Button size="sm" onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            )}
            {permissions.export && sortedData.length > 0 && (
              <Button size="sm" variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {searchable && (
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="sr-only">Filter</span>
            </Button>
          </div>
        )}

        <div className="rounded-md border overflow-hidden">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.map((column) => (
                    <TableHead
                      key={column.field.toString()}
                      className={
                        column.sortable ? "cursor-pointer select-none" : ""
                      }
                      onClick={() =>
                        column.sortable && handleSort(column.field as keyof T)
                      }
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.header}</span>
                        {column.sortable && (
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                  {(permissions.update || permissions.delete) && (
                    <TableHead className="w-[80px]"></TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => (
                    <TableRow
                      key={`${item[idField]}-${index}`}
                      className={`animate-fade-in transition-colors ${
                        onRowClick ? "cursor-pointer hover:bg-muted/50" : ""
                      }`}
                      onClick={() => onRowClick && onRowClick(item)}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      {visibleColumns.map((column) => (
                        <TableCell
                          key={`${item[idField]}-${column.field.toString()}`}
                        >
                          {column.render
                            ? column.render(item)
                            : item[column.field as keyof T] !== undefined &&
                              item[column.field as keyof T] !== null
                            ? String(item[column.field as keyof T])
                            : "-"}
                        </TableCell>
                      ))}
                      {(permissions.update || permissions.delete) && (
                        <TableCell>
                          <TableActions
                            item={item}
                            idField={idField}
                            permissions={permissions}
                            onEdit={permissions.update ? handleEdit : undefined}
                            onDelete={
                              permissions.delete
                                ? (id) => setDeleteItemId(id)
                                : undefined
                            }
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={
                        visibleColumns.length +
                        (permissions.update || permissions.delete ? 1 : 0)
                      }
                      className="h-24 text-center"
                    >
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {pagination && (
          <Pagination
            totalItems={sortedData.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        )}

        {/* Edit/Create Modal */}
        <EditModal
          isOpen={isCreating || editingItem !== null}
          onClose={() => {
            setEditingItem(null);
            setIsCreating(false);
          }}
          item={editingItem}
          onSave={handleSave}
          columns={columns}
          idField={idField}
          isCreating={isCreating}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={deleteItemId !== null}
          onOpenChange={(open) => !open && setDeleteItemId(null)}
        >
          <AlertDialogContent className="animate-fade-in">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this
                item.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

export default DataTable;
