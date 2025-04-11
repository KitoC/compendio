import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CustomTableService } from "@/services/CustomTableService";
import { AirtableTable } from "@/types/airtable";
import { AirtableRecord } from "@/components/airtable-table/types";
import { toast } from "sonner";

interface UseAirtableQueryOptions {
  baseId?: string;
  tableId?: string;
  enableRealtime?: boolean;
  recordId?: string;
}

/**
 * Hook to fetch Airtable base schema
 */
export const useAirtableTableSchemaQuery = (tableId?: string) => {
  return useQuery({
    queryKey: ["airtable", "base", tableId],
    queryFn: async () => {
      const table = await CustomTableService.getTableSchema(tableId);

      const tableSchema = {
        ...table,
        primaryFieldId: table.primary_field_id,
        fields: table.fields.map((field) => field.schema),
      };
      return tableSchema as unknown as AirtableTable;
    },
    enabled: !!tableId,
  });
};

/**
 * Hook for creating Airtable records
 */
export const useCreateRecord = (tableId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fields: Record<string, unknown>) => {
      const response = await CustomTableService.createRecord(tableId, fields);
      if (response.error) {
        throw new Error(`Failed to create record: ${response.error.message}`);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["airtable", "records", tableId],
      });
      toast.success("Record created successfully");
    },
    onError: (error) => {
      console.error("Error creating record:", error);
      toast.error("Failed to create record");
    },
  });
};

/**
 * Hook for updating Airtable records
 */
export const useUpdateRecord = (tableId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      fields,
    }: {
      id: string;
      fields: Record<string, unknown>;
    }) => {
      const response = await CustomTableService.updateRecord(
        tableId,
        id,
        fields
      );
      if (response.error) {
        throw new Error(`Failed to update record: ${response.error.message}`);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["airtable", "records", tableId],
      });
      toast.success("Record updated successfully");
    },
    onError: (error) => {
      console.error("Error updating record:", error);
      toast.error("Failed to update record");
    },
  });
};

/**
 * Hook for deleting Airtable records
 */
export const useDeleteRecord = (tableId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await CustomTableService.deleteRecord(tableId, id);
      if (response.error) {
        throw new Error(`Failed to delete record: ${response.error.message}`);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["airtable", "records", tableId],
      });
      toast.success("Record deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
    },
  });
};

/**
 * Hook to fetch Airtable table records
 */
export const useAirtableRecordsQuery = ({
  tableId,
  enableRealtime = false,
}: UseAirtableQueryOptions = {}) => {
  const { data: records, ...queryResults } = useQuery({
    queryKey: ["airtable", "records", tableId],
    queryFn: async () => {
      if (!tableId) {
        throw new Error("Table name is required");
      }

      const response = await CustomTableService.listRecords(tableId);

      if (response.error) {
        throw new Error(
          `Failed to fetch Airtable records: ${response.error.message}`
        );
      }

      return response.data as AirtableRecord[];
    },
    enabled: !!tableId,
  });

  const createRecordMutation = useCreateRecord(tableId);
  const updateRecordMutation = useUpdateRecord(tableId);
  const deleteRecordMutation = useDeleteRecord(tableId);

  return {
    ...queryResults,
    records,
    createRecord: createRecordMutation.mutate,
    updateRecord: updateRecordMutation.mutate,
    deleteRecord: deleteRecordMutation.mutate,
    createRecordMutation,
    updateRecordMutation,
    deleteRecordMutation,
  };
};

/**
 * Hook to fetch Airtable table record
 */
export const useAirtableRecordQuery = ({
  tableId,
  recordId,
  enableRealtime = false,
}: UseAirtableQueryOptions = {}) => {
  const { data: record, ...queryResults } = useQuery({
    queryKey: ["airtable", "record", tableId, recordId],
    queryFn: async () => {
      if (!tableId) {
        throw new Error("Table name is required");
      }

      const response = await CustomTableService.getRecord(tableId, recordId);

      if (response.error) {
        throw new Error(
          `Failed to fetch Airtable records: ${response.error.message}`
        );
      }

      console.log("RESPONSE:", response.data);

      return response.data as AirtableRecord;
    },
    enabled: !!tableId && !!recordId,
  });

  const createRecordMutation = useCreateRecord(tableId);
  const updateRecordMutation = useUpdateRecord(tableId);
  const deleteRecordMutation = useDeleteRecord(tableId);

  return {
    ...queryResults,
    record,
    createRecord: createRecordMutation.mutate,
    updateRecord: updateRecordMutation.mutate,
    deleteRecord: deleteRecordMutation.mutate,
    createRecordMutation,
    updateRecordMutation,
    deleteRecordMutation,
  };
};
