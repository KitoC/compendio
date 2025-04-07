
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
  Download,
  ArrowUpDown,
  SlidersHorizontal,
  Filter,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AirtableTableProps, AirtableRecord, UserPermissions } from "./types";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatFieldValue } from "./utils";
import EditModal from "./EditModal";
import FieldFilter from "./FieldFilter";
import { AirtableField } from "@/types/airtable";

// Default permissions
const defaultPermissions: UserPermissions = {
  create: true,
  read: true,
  update: true,
  delete: true,
  export: true,
};

const AirtableTable = ({
  table,
  records,
  idField = "id",
  permissions: providedPermissions,
  onRowClick,
  onUpdate,
  onCreate,
  onDelete,
  isLoading = false,
  emptyMessage = "No records available",
  className,
  searchable = true,
  pagination = true,
  pageSize = 10,
  getFormConfig,
}: AirtableTableProps) => {
  const isMobile = useIsMobile();
  
  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [editingRecord, setEditingRecord] = useState<AirtableRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteRecordId, setDeleteRecordId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [filterOpen, setFilterOpen] = useState<string | null>(null);

  // Merge provided permissions with defaults
  const permissions: UserPermissions = {
    ...defaultPermissions,
    ...providedPermissions,
  };

  // Reset pagination when records change
  useEffect(() => {
    setCurrentPage(1);
  }, [records.length]);

  // Get visible fields
  const visibleFields = useMemo(() => {
    // Filter out computed or system fields if desired
    return table.fields.filter(field => 
      !["createdBy", "lastModifiedBy"].includes(field.type)
    );
  }, [table]);

  // Handle filtering, searching, and sorting
  const processedRecords = useMemo(() => {
    let filtered = [...records];
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(record => {
        return visibleFields.some(field => {
          const value = record.fields[field.name];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(term);
        });
      });
    }
    
    // Apply filters
    Object.entries(filters).forEach(([fieldName, value]) => {
      if (value === null || value === '' || value === undefined) return;
      
      filtered = filtered.filter(record => {
        const fieldValue = record.fields[fieldName];
        if (fieldValue === null || fieldValue === undefined) return false;
        
        // Handle different field types
        const field = table.fields.find(f => f.name === fieldName);
        if (!field) return false;
        
        switch (field.type) {
          case "checkbox":
            return fieldValue === value;
          case "date":
          case "dateTime":
            // Simple date comparison (could be enhanced for ranges)
            const recordDate = new Date(fieldValue).setHours(0, 0, 0, 0);
            const filterDate = new Date(value).setHours(0, 0, 0, 0);
            return recordDate === filterDate;
          case "singleSelect":
            return fieldValue === value;
          default:
            // Text-based search
            return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
        }
      });
    });
    
    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = a.fields[sortField];
        const bValue = b.fields[sortField];

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
          ? aValue > bValue ? 1 : -1
          : aValue > bValue ? -1 : 1;
      });
    }
    
    return filtered;
  }, [records, visibleFields, searchTerm, filters, sortField, sortDirection]);

  // Handle pagination
  const paginatedRecords = useMemo(() => {
    if (!pagination) return processedRecords;

    const startIndex = (currentPage - 1) * pageSize;
    return processedRecords.slice(startIndex, startIndex + pageSize);
  }, [processedRecords, currentPage, pageSize, pagination]);

  // Handle sorting toggle
  const handleSort = (fieldName: string) => {
    if (sortField === fieldName) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(fieldName);
      setSortDirection("asc");
    }
  };

  // Handle edit
  const handleEdit = (record: AirtableRecord) => {
    setEditingRecord(record);
    setIsCreating(false);
  };

  // Handle create
  const handleCreate = () => {
    setEditingRecord(null);
    setIsCreating(true);
  };

  // Handle save (create or update)
  const handleSave = async (record: AirtableRecord) => {
    try {
      if (isCreating) {
        if (onCreate) {
          await onCreate(record);
        }
      } else {
        if (onUpdate) {
          await onUpdate(record);
        }
      }
    } catch (error) {
      console.error("Error saving record:", error);
      throw error;
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (deleteRecordId !== null && onDelete) {
      try {
        await onDelete(deleteRecordId);
        toast.success("Record deleted successfully");
      } catch (error) {
        console.error("Error deleting record:", error);
        toast.error("Failed to delete record");
      } finally {
        setDeleteRecordId(null);
      }
    }
  };

  // Handle filter change
  const handleFilterChange = (fieldName: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [fieldName]: value
    }));
    setFilterOpen(null);
  };

  // Handle export
  const handleExport = () => {
    if (!permissions.export) return;

    try {
      // Get field names
      const fieldNames = visibleFields.map(field => field.name);
      const csvRows = [fieldNames.join(",")];

      for (const record of processedRecords) {
        const values = fieldNames.map(fieldName => {
          const field = table.fields.find(f => f.name === fieldName);
          if (!field) return "";
          
          const value = record.fields[fieldName];
          const formatted = formatFieldValue(value, field);
          
          // Ensure CSV compatibility
          return value !== null && value !== undefined
            ? `"${String(formatted).replace(/"/g, '""')}"`
            : "";
        });
        csvRows.push(values.join(","));
      }

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${table.name}_export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Export completed");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  };

  // Filter visible fields based on screen size
  const displayFields = useMemo(() => {
    if (!isMobile) return visibleFields;
    // On mobile, show fewer fields
    return visibleFields.slice(0, 2);
  }, [visibleFields, isMobile]);

  // Calculate pagination
  const totalPages = Math.ceil(processedRecords.length / pageSize);
  
  // Render loading skeletons
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{table.name}</CardTitle>
          {table.description && <CardDescription>{table.description}</CardDescription>}
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

  // Render Table Actions Cell
  const renderActionsCell = (record: AirtableRecord) => {
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
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>{table.name}</CardTitle>
            {table.description && <CardDescription>{table.description}</CardDescription>}
          </div>
          <div className="flex space-x-2">
            {permissions.create && (
              <Button size="sm" onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            )}
            {permissions.export && processedRecords.length > 0 && (
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
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="sr-only">Filters</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">Filters</h4>
                  {Object.keys(filters).length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {Object.keys(filters).length} filter(s) applied
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setFilters({})}
                      >
                        Clear all
                      </Button>
                    </div>
                  )}
                  <div className="space-y-2">
                    {table.fields.map(field => (
                      <div key={field.id} className="flex items-center justify-between">
                        <span className="text-sm">{field.name}</span>
                        <Popover 
                          open={filterOpen === field.name} 
                          onOpenChange={(open) => setFilterOpen(open ? field.name : null)}
                        >
                          <PopoverTrigger asChild>
                            <Button 
                              size="sm" 
                              variant={filters[field.name] ? "default" : "outline"}
                              className="h-8"
                            >
                              <Filter className="h-3 w-3 mr-1" />
                              {filters[field.name] ? "Filtered" : "Filter"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-3">
                            <FieldFilter
                              field={field}
                              value={filters[field.name] || ''}
                              onChange={(value) => handleFilterChange(field.name, value)}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}

        <div className="rounded-md border overflow-hidden">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {displayFields.map((field) => (
                    <TableHead
                      key={field.id}
                      className="cursor-pointer select-none"
                      onClick={() => handleSort(field.name)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{field.name}</span>
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TableHead>
                  ))}
                  {(permissions.update || permissions.delete) && (
                    <TableHead className="w-[80px]"></TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.length > 0 ? (
                  paginatedRecords.map((record, index) => (
                    <TableRow
                      key={record.id}
                      className={`animate-fade-in transition-colors ${
                        onRowClick ? "cursor-pointer hover:bg-muted/50" : ""
                      }`}
                      onClick={() => onRowClick && onRowClick(record)}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      {displayFields.map((field) => (
                        <TableCell key={field.id}>
                          {formatFieldValue(record.fields[field.name], field)}
                        </TableCell>
                      ))}
                      {(permissions.update || permissions.delete) && (
                        <TableCell>
                          {renderActionsCell(record)}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={
                        displayFields.length +
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

        {/* Pagination */}
        {pagination && totalPages > 1 && (
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * pageSize) + 1}-
              {Math.min(currentPage * pageSize, processedRecords.length)} of {processedRecords.length}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => 
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Edit/Create Modal */}
        <EditModal
          isOpen={isCreating || editingRecord !== null}
          onClose={() => {
            setEditingRecord(null);
            setIsCreating(false);
          }}
          record={editingRecord}
          table={table}
          onSave={handleSave}
          idField={idField}
          isCreating={isCreating}
          getFormConfig={getFormConfig}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={deleteRecordId !== null}
          onOpenChange={(open) => !open && setDeleteRecordId(null)}
        >
          <AlertDialogContent className="animate-fade-in">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this
                record.
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
};

export default AirtableTable;
