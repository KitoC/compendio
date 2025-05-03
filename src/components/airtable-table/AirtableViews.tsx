import { useState, useEffect, useMemo, useCallback } from "react";
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
  Plus,
  Search,
  Download,
  SlidersHorizontal,
  Filter,
  RefreshCw,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AirtableTableProps, UserPermissions } from "./types";
import { AirtableRecord } from "@/types/airtable";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatFieldValue } from "./utils";
import FieldFilter from "./FieldFilter";
import { Tag } from "@/components/ui/tag";
import {
  GridView,
  CalendarView,
  GalleryView,
  KanbanView,
  TimelineView,
  ViewType,
} from "./views";
import ViewTypeSelector from "./ViewTypeSelector";
import { DEFAULT_VIEW } from "./consts";
import { cn } from "@/lib/utils";
import AirtableModal from "../airtable-modal";
import pluralize from "pluralize";
import { IDataView } from "@/services/DataViewsService";
import { DataViewProvider } from "@/contexts/DataViewProvider";

const defaultPermissions: UserPermissions = {
  create: true,
  read: true,
  update: true,
  delete: true,
  export: true,
};

const AirtableViews = (props: AirtableTableProps) => {
  const {
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
    onRefresh,
    isRefreshing,
  } = props;
  const isMobile = useIsMobile();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [editingRecord, setEditingRecord] = useState<AirtableRecord | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [deleteRecordId, setDeleteRecordId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [filterOpen, setFilterOpen] = useState<string | null>(null);
  const [dataView, setViewType] = useState<IDataView>(DEFAULT_VIEW);

  const permissions: UserPermissions = {
    ...defaultPermissions,
    ...providedPermissions,
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [records.length]);

  const primaryField = useMemo(() => {
    if (table && table.primaryFieldId) {
      return table.fields.find((field) => field.id === table.primaryFieldId);
    }
    return null;
  }, [table]);

  const organizedFields = useMemo(() => {
    if (!table || !table.fields) return [];

    const filteredFields = table.fields.filter(
      (field) => !["createdBy", "lastModifiedBy"].includes(field.type)
    );

    const sortedFields = [...filteredFields];

    if (primaryField) {
      const primaryFieldIndex = sortedFields.findIndex(
        (f) => f.id === primaryField.id
      );
      if (primaryFieldIndex > -1) {
        const [removed] = sortedFields.splice(primaryFieldIndex, 1);
        sortedFields.unshift(removed);
      }
    }

    return sortedFields;
  }, [table, primaryField]);

  const processedRecords = useMemo(() => {
    let filtered = [...records];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((record) => {
        return organizedFields.some((field) => {
          const value = record.fields[field.name];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(term);
        });
      });
    }

    Object.entries(filters).forEach(([fieldName, value]) => {
      if (value === null || value === "" || value === undefined) return;

      filtered = filtered.filter((record) => {
        const fieldValue = record.fields[fieldName];
        if (fieldValue === null || fieldValue === undefined) return false;

        const field = table.fields.find((f) => f.name === fieldName);
        if (!field) return false;
        const recordDate = new Date(fieldValue as string).setHours(0, 0, 0, 0);
        const filterDate = new Date(value as string).setHours(0, 0, 0, 0);

        switch (field.type) {
          case "checkbox":
            return fieldValue === value;
          case "date":
          case "dateTime":
            return recordDate === filterDate;
          case "singleSelect":
            return fieldValue === value;
          default:
            return String(fieldValue)
              .toLowerCase()
              .includes(String(value).toLowerCase());
        }
      });
    });

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
          ? aValue > bValue
            ? 1
            : -1
          : aValue > bValue
          ? -1
          : 1;
      });
    }

    return filtered;
  }, [
    records,
    organizedFields,
    searchTerm,
    filters,
    sortField,
    sortDirection,
    table,
  ]);

  const paginatedRecords = useMemo(() => {
    if (!pagination) return processedRecords;

    const startIndex = (currentPage - 1) * pageSize;
    return processedRecords.slice(startIndex, startIndex + pageSize);
  }, [processedRecords, currentPage, pageSize, pagination]);

  const handleSort = (fieldName: string) => {
    if (sortField === fieldName) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(fieldName);
      setSortDirection("asc");
    }
  };

  const handleEdit = useCallback(
    (record: AirtableRecord) => {
      setEditingRecord(record);
      setIsCreating(false);
    },
    [setEditingRecord, setIsCreating]
  );

  const handleCreate = () => {
    setEditingRecord(null);
    setIsCreating(true);
  };

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

  const handleDeleteConfirm = async () => {
    if (deleteRecordId !== null && onDelete) {
      try {
        await onDelete(deleteRecordId);
      } catch (error) {
        console.error("Error deleting record:", error);
        toast.error("Failed to delete record");
      } finally {
        setDeleteRecordId(null);
      }
    }
  };

  const handleFilterChange = (fieldName: string, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    setFilterOpen(null);
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
    }
  };

  const handleExport = () => {
    if (!permissions.export) return;

    try {
      const fieldNames = organizedFields.map((field) => field.name);
      const csvRows = [fieldNames.join(",")];

      for (const record of processedRecords) {
        const values = fieldNames.map((fieldName) => {
          const field = table.fields.find((f) => f.name === fieldName);
          if (!field) return "";

          const value = record.fields[fieldName];
          const formatted = formatFieldValue(value, field, record);

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

  const totalPages = Math.ceil(processedRecords.length / pageSize);

  const handleRowClick = useCallback(
    (record: AirtableRecord) => {
      if (onRowClick) {
        onRowClick(record);
      } else {
        handleEdit(record);
      }
    },
    [onRowClick, handleEdit]
  );

  const renderView = () => {
    const commonProps = {
      records: pagination ? paginatedRecords : processedRecords,
      table,
      isLoading,
      onRowClick: handleRowClick,
      emptyMessage,
      sortField,
      sortDirection,
      handleSort,
      permissions,
      paginatedRecords,
      handleEdit,
      handleCreate,
      handleDeleteConfirm,
      handleFilterChange,
      handleExport,
      handleRefresh,
      setDeleteRecordId,
      dataViewId: dataView.id,
    };

    switch (dataView.view_type) {
      case "calendar":
        return <CalendarView {...commonProps} />;
      case "gallery":
        return <GalleryView {...commonProps} />;
      case "kanban":
        return <KanbanView {...commonProps} />;
      case "timeline":
        return <TimelineView {...commonProps} />;
      case "grid":
      default:
        return <GridView {...commonProps} />;
    }
  };

  return (
    <Card className={`${className} flex flex-col`}>
      <CardHeader>
        <div className="flex flex-col mb-2">
          <div className="flex space-x-2 justify-between w-full border-b border-border pb-2">
            <div className="flex items-end gap-4">
              <CardTitle>{table.name}</CardTitle>

              <ViewTypeSelector
                currentDataView={dataView}
                setViewType={setViewType}
                tableId={table.external_id}
              />
            </div>
            <div className="flex space-x-2 items-end">
              {onRefresh && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={cn("h-3 w-3", {
                      "animate-spin": isRefreshing,
                    })}
                  />
                  Refresh
                </Button>
              )}
              {permissions.export && processedRecords.length > 0 && (
                <Button size="xs" variant="outline" onClick={handleExport}>
                  <Download className="h-3 w-3" />
                  Export
                </Button>
              )}

              {permissions.create && (
                <Button size="xs" onClick={handleCreate}>
                  <Plus className="h-3 w-3" />
                  New {pluralize.singular(table.name)}
                </Button>
              )}
            </div>
          </div>
          {table.description && (
            <CardDescription>{table.description}</CardDescription>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto flex flex-col">
        {/* Applied filters display */}
        {Object.keys(filters).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0 mb-4">
            {Object.entries(filters).map(([fieldName, value]) => {
              if (value === null || value === "") return null;

              const field = table.fields.find((f) => f.name === fieldName);

              const displayValue =
                typeof value === "boolean"
                  ? value
                    ? "Yes"
                    : "No"
                  : String(value);

              return (
                <Tag
                  key={fieldName}
                  variant="outline"
                  onRemove={() => handleFilterChange(fieldName, null)}
                >
                  {field?.name || fieldName}: {displayValue}
                </Tag>
              );
            })}

            {Object.keys(filters).length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={() => setFilters({})}
              >
                Clear all
              </Button>
            )}
          </div>
        )}

        {searchable && dataView.view_type === "grid" && (
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
            <Popover open={filterOpen !== null}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setFilterOpen(filterOpen ? null : "filters")}
                >
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
                    {table.fields.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{field.name}</span>
                        <Popover
                          open={filterOpen === field.name}
                          onOpenChange={(open) =>
                            setFilterOpen(open ? field.name : null)
                          }
                        >
                          <PopoverTrigger asChild>
                            <Button
                              size="sm"
                              variant={
                                filters[field.name] ? "default" : "outline"
                              }
                              className="h-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFilters((prev) => ({
                                  ...prev,
                                  [field.name]: "",
                                }));
                              }}
                            >
                              <Filter className="h-3 w-3 mr-1" />
                              {filters[field.name] ? "Filtered" : "Filter"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-3">
                            <FieldFilter
                              field={field}
                              value={filters[field.name] || ""}
                              onChange={(value) =>
                                handleFilterChange(field.name, value)
                              }
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

        <DataViewProvider dataViewId={dataView.id} tableId={table.external_id}>
          <div className="flex-grow overflow-auto">{renderView()}</div>
        </DataViewProvider>

        {pagination && dataView.view_type === "grid" && (
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, processedRecords.length)} of{" "}
              {processedRecords.length}
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

        <AirtableModal
          providedTable={table}
          providedRecord={editingRecord}
          tableId={table?.external_id}
          recordId={editingRecord?.id}
          isCreating={isCreating}
          getFormConfig={getFormConfig}
          onSave={handleSave}
          onClose={() => {
            setEditingRecord(null);
            setIsCreating(false);
          }}
          isOpen={isCreating || editingRecord !== null}
        />

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

export default AirtableViews;
