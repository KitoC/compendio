import { useQuery } from "@tanstack/react-query";
import { CustomTableService } from "@/services/CustomTableService";
import { AirtableTable } from "@/types/airtable";
import { AirtableRecord } from "@/components/airtable-table/types";
import { toast } from "sonner";

interface UseAirtableQueryOptions {
  baseId?: string;
  tableName?: string;
  enableRealtime?: boolean;
}

/**
 * Hook to fetch Airtable base schema
 */
export const useAirtableTableSchemaQuery = (tableName?: string) => {
  return useQuery({
    queryKey: ["airtable", "base", tableName],
    queryFn: async () => {
      const table = await CustomTableService.getTableSchema(tableName);

      const tableSchema = {
        ...table,
        primaryFieldId: table.primary_field_id,
        fields: table.fields.map((field) => field.schema),
      };
      return tableSchema as unknown as AirtableTable;
    },
    enabled: !!tableName,
  });
};

/**
 * Hook to fetch Airtable table records
 */
export const useAirtableRecordsQuery = ({
  tableName,
  enableRealtime = false,
}: UseAirtableQueryOptions = {}) => {
  const { data: records, ...queryResults } = useQuery({
    queryKey: ["airtable", "records", tableName],
    queryFn: async () => {
      if (!tableName) {
        throw new Error("Table name is required");
      }

      const response = await CustomTableService.listRecords(tableName);

      if (response.error) {
        throw new Error(
          `Failed to fetch Airtable records: ${response.error.message}`
        );
      }

      return response.data as AirtableRecord[];
    },
    enabled: !!tableName,
  });

  // Mutations for CRUD operations
  const createRecord = async (fields: Record<string, unknown>) => {
    try {
      const response = await CustomTableService.createRecord(tableName, fields);

      if (response.error) {
        throw new Error(`Failed to create record: ${response.error.message}`);
      }

      toast.success("Record created successfully");
      return response.data;
    } catch (error) {
      console.error("Error creating record:", error);
      toast.error("Failed to create record");
      throw error;
    }
  };

  const updateRecord = async (id: string, fields: Record<string, unknown>) => {
    try {
      const response = await CustomTableService.updateRecord(
        tableName,
        id,
        fields
      );

      if (response.error) {
        throw new Error(`Failed to update record: ${response.error.message}`);
      }

      toast.success("Record updated successfully");
      return response.data;
    } catch (error) {
      console.error("Error updating record:", error);
      toast.error("Failed to update record");
      throw error;
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const response = await CustomTableService.deleteRecord(tableName, id);

      if (response.error) {
        throw new Error(`Failed to delete record: ${response.error.message}`);
      }

      toast.success("Record deleted successfully");
      return response.data;
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
      throw error;
    }
  };

  return {
    ...queryResults,
    records,
    createRecord,
    updateRecord,
    deleteRecord,
  };
};
