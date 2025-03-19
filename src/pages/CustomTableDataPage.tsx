// NO_CHANGE
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import DataTable from "@/components/data-table";
import type { Column } from "@/components/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import Page from "@/components/Page";

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
  const { tenantId } = useAuth();
  const navigate = useNavigate();

  const [tableDefinition, setTableDefinition] =
    useState<CustomTableDefinition | null>(null);
  const [tableFields, setTableFields] = useState<CustomTableField[]>([]);
  const [tableData, setTableData] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the table definition
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

        // Fetch the actual table data
        if (definitionData.name) {
          const { data: tableData, error: tableDataError } = await supabase.rpc(
            "get_custom_table_data",
            {
              p_table_name: definitionData.name,
              p_tenant_id: tenantId,
            }
          );

          if (tableDataError) throw tableDataError;

          setTableData((tableData || []) as unknown[]);
        }
      } catch (error) {
        console.error("Error fetching table data:", error);
        toast.error("Failed to load table data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTableDefinition();
  }, [id, tenantId, navigate]);

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

  // Handle creating a new record
  const handleCreate = async (newRecord: unknown) => {
    if (!tableDefinition?.name || !tenantId) return;

    const { data, error } = await supabase.rpc("insert_custom_table_record", {
      p_table_name: tableDefinition.name,
      p_tenant_id: tenantId,
      p_data: newRecord,
    });

    if (error) throw error;

    toast.success("Record created successfully");

    // Refresh the data
    const { data: refreshedData, error: refreshError } = await supabase.rpc(
      "get_custom_table_data",
      {
        p_table_name: tableDefinition.name,
        p_tenant_id: tenantId,
      }
    );

    if (refreshError) throw refreshError;
    setTableData((tableData || []) as unknown[]);
  };

  // Handle updating a record
  const handleUpdate = async (updatedRecord: object) => {
    if (!tableDefinition?.name || !tenantId) return;

    // Extract the ID and remove it from the data
    const { id: recordId, ...recordData } = updatedRecord;

    const { error } = await supabase.rpc("update_custom_table_record", {
      p_table_name: tableDefinition.name,
      p_record_id: recordId,
      p_tenant_id: tenantId,
      p_data: recordData,
    });

    if (error) throw error;

    toast.success("Record updated successfully");

    // Refresh the data
    const { data: refreshedData, error: refreshError } = await supabase.rpc(
      "get_custom_table_data",
      {
        p_table_name: tableDefinition.name,
        p_tenant_id: tenantId,
      }
    );

    if (refreshError) throw refreshError;
    setTableData((tableData || []) as unknown[]);
  };

  // Handle deleting a record
  const handleDelete = async (recordId: string) => {
    if (!tableDefinition?.name || !tenantId) return;

    const { error } = await supabase.rpc("delete_custom_table_record", {
      p_table_name: tableDefinition.name,
      p_record_id: recordId,
      p_tenant_id: tenantId,
    });

    if (error) throw error;

    toast.success("Record deleted successfully");

    // Refresh the data
    const { data: refreshedData, error: refreshError } = await supabase.rpc(
      "get_custom_table_data",
      {
        p_table_name: tableDefinition.name,
        p_tenant_id: tenantId,
      }
    );

    if (refreshError) throw refreshError;
    setTableData((tableData || []) as unknown[]);
  };

  if (isLoading) {
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

  return (
    <Page>
      {tableDefinition && (
        <DataTable
          data={tableData}
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
        />
      )}
    </Page>
  );
};

export default CustomTableDataPage;
