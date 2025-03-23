import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import DataTable from "@/components/data-table";
import type { Column } from "@/components/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import Page from "@/components/Page";
import { FormConfig } from "@/components/form-builder/types";
import { useCustomTableDataService } from "@/hooks/useCustomTableDataService";
import { useTenant } from "@/contexts/TenantContext";
interface CustomTableField {
  id: string;
  name: string;
  display_name: string;
  field_type: string;
  is_required: boolean;
  is_unique: boolean;
}

interface CustomTableDefinition {
  id: string;
  name: string;
  display_name: string;
  description: string;
  icon: string;
}

const CustomTableDataPage = () => {
  const { id } = useParams<{ id: string }>();
  const { tenantId } = useTenant();
  const navigate = useNavigate();

  const [tableDefinition, setTableDefinition] =
    useState<CustomTableDefinition | null>(null);
  const [tableFields, setTableFields] = useState<CustomTableField[]>([]);
  const [tableData, setTableData] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalPages: 1,
    totalItems: 0,
  });
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const customTableDataService = useCustomTableDataService();

  // Fetch the table definition and fields
  useEffect(() => {
    const fetchTableDefinition = async () => {
      try {
        if (!id || !tenantId) return;

        const { data: definitionData, error: definitionError } = await supabase
          .from("custom_table_definitions")
          .select("*")
          .eq("id", id)
          .eq("tenant_id", tenantId)
          .single();

        if (definitionError) throw definitionError;
        if (!definitionData) {
          toast.error("Table definition not found");
          navigate("/settings/custom-tables");
          return;
        }

        setTableDefinition(definitionData);

        // Fetch the table fields
        const { data: fieldsData, error: fieldsError } = await supabase
          .from("custom_table_fields")
          .select("*")
          .eq("table_id", id)
          .eq("tenant_id", tenantId)
          .is("deleted_at", null);

        if (fieldsError) throw fieldsError;
        setTableFields(fieldsData || []);

        // Load initial data
        await fetchTableData();
      } catch (error) {
        console.error("Error fetching table definition:", error);
        toast.error("Failed to load table definition");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTableDefinition();
  }, [id, tenantId, navigate]);

  // Fetch table data with pagination, sorting, filtering
  const fetchTableData = async () => {
    try {
      if (!id) return;

      setIsLoading(true);

      const response = await customTableDataService.getTableData(id, {
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortField,
        sortDirection,
        search: searchTerm,
        filters,
      });

      setTableData(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Error fetching table data:", error);
      toast.error("Failed to load table data");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate columns for the DataTable based on table fields
  const generateColumns = (): Column<unknown>[] => {
    if (!tableFields.length) return [];

    return tableFields.map((field) => ({
      field: field.name,
      header: field.display_name,
      sortable: true,
      render: (item) => {
        const value = item[field.name];

        // Handle different field types
        switch (field.field_type) {
          case "boolean":
            return value ? "Yes" : "No";
          case "timestamp":
            return value ? new Date(value).toLocaleString() : "-";
          case "reference":
            return value || "-"; // In a real app, you might fetch the referenced entity
          default:
            return value || "-";
        }
      },
    }));
  };

  // Generate custom form config based on field definitions
  const getFormConfig = (defaultConfig: FormConfig): FormConfig => {
    // Map field type from database to form field type
    const mapFieldType = (dbType: string): string => {
      switch (dbType) {
        case "integer":
          return "number";
        case "boolean":
          return "checkbox";
        case "timestamp":
          return "date";
        case "reference":
          return "select";
        case "uuid":
          return "text";
        default:
          return "text";
      }
    };

    // Create form fields based on table fields
    const formFields = tableFields.map((field) => ({
      id: field.id,
      name: field.name,
      label: field.display_name,
      type: mapFieldType(field.field_type) as unknown,
      placeholder: `Enter ${field.display_name.toLowerCase()}`,
      validation: {
        required: field.is_required,
      },
      // Add options for select fields if available
      ...(field.field_type === "reference" && {
        options: [], // You would populate this with actual options
      }),
    }));

    // Update the config sections with our fields
    return {
      ...defaultConfig,
      sections: [
        {
          id: "main",
          title: "Record Details",
          fields: formFields,
        },
      ],
    };
  };

  // Handle creating a new record
  const handleCreate = async (newRecord: Record<string, unknown>) => {
    try {
      if (!id) return;

      await customTableDataService.createRecord(id, newRecord);
      toast.success("Record created successfully");

      // Refresh the data
      fetchTableData();
    } catch (error) {
      console.error("Error creating record:", error);
      toast.error("Failed to create record");
      throw error; // Re-throw to let the form handler deal with it
    }
  };

  // Handle updating a record
  const handleUpdate = async (updatedRecord: Record<string, unknown>) => {
    try {
      if (!id) return;

      const recordId = updatedRecord.id as string;
      // Remove id from the data object
      const { id: _ } = updatedRecord;

      const data = {};
      Object.entries(updatedRecord.data).forEach(([Key, value]) => {
        if (Object.prototype.hasOwnProperty.call(updatedRecord, Key)) {
          data[Key] = updatedRecord[Key];
        } else {
          data[Key] = value;
        }
      });

      await customTableDataService.updateRecord(recordId, id, data);
      toast.success("Record updated successfully");

      // Refresh the data
      fetchTableData();
    } catch (error) {
      console.error("Error updating record:", error);
      toast.error("Failed to update record");
      throw error; // Re-throw to let the form handler deal with it
    }
  };

  // Handle deleting a record
  const handleDelete = async (recordId: string) => {
    try {
      await customTableDataService.deleteRecord(recordId);
      toast.success("Record deleted successfully");

      // Refresh the data
      fetchTableData();
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
      throw error;
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  // Handle sort change
  const handleSortChange = (field: string) => {
    if (field === sortField) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Effect to reload data when pagination, sort or filters change
  useEffect(() => {
    if (tableDefinition) {
      fetchTableData();
    }
  }, [
    pagination.page,
    pagination.pageSize,
    sortField,
    sortDirection,
    searchTerm,
    filters,
  ]);

  if (isLoading && !tableDefinition) {
    return (
      <Page>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-96 w-full" />
      </Page>
    );
  }

  const restructedTableData = tableData.map((item) => {
    return { ...item, ...item.data };
  });

  return (
    <Page>
      {tableDefinition && (
        <DataTable
          data={restructedTableData}
          columns={generateColumns()}
          idField="id"
          title={tableDefinition.display_name}
          subtitle={tableDefinition.description || ""}
          permissions={{
            create: true,
            update: true,
            delete: true,
            read: true,
            export: true,
          }}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          searchable
          pagination
          pageSize={pagination.pageSize}
          currentPage={pagination.page}
          totalItems={pagination.totalItems}
          onPageChange={handlePageChange}
          onSearch={(term) => setSearchTerm(term)}
          onSort={handleSortChange}
          sortField={sortField}
          sortDirection={sortDirection}
          getFormConfig={getFormConfig}
          isLoading={isLoading}
        />
      )}
    </Page>
  );
};

export default CustomTableDataPage;
