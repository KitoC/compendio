import {
  useQuery,
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from "@tanstack/react-query";
import { CustomTableService } from "@/services/CustomTableService";
import { AirtableTable, AirtableRecord } from "@/types/airtable";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { useCustomTables } from "@/contexts/CustomTables";
import { useCallback, useMemo } from "react";
import pluralize from "pluralize";
interface UseAirtableQueryOptions {
  baseId?: string;
  tableId?: string;
  enableRealtime?: boolean;
  recordId?: string;
  queryString?: string;
  isOptimistic?: boolean;
}

const QUERY_KEYS = {
  BASE: "airtable_base",
  RECORDS: "airtable_records",
  RECORD: "airtable_record",
};

/**
 * Hook to fetch Airtable base schema
 */
export const useAirtableTableSchemaQuery = (tableId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.BASE, tableId],
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

const useGetCurrentPageQueryKeyFromParams = () => {
  const params = useParams();

  const { tables } = useCustomTables();
  const table = tables.find((table) => table.name === params.id);

  if (!table) return null;

  return [QUERY_KEYS.RECORDS, table?.external_id];
};

type UseMutationConfig<T> = UseMutationOptions<
  AirtableRecord,
  Error,
  Record<string, unknown> | T
>;

type MutationFnOptions<T> = {
  optimistic?: boolean;
};

type MutationFnArgs<T> = {
  record: AirtableRecord;
  options?: MutationFnOptions<T>;
};
/**
 * Hook for creating Airtable records
 */
export const useCreateRecord = (
  tableId: string,
  options: UseMutationConfig<AirtableRecord> = {}
) => {
  const queryClient = useQueryClient();

  const queryKeyFromParams = useGetCurrentPageQueryKeyFromParams();

  return useMutation({
    mutationFn: async ({ record }: MutationFnArgs<AirtableRecord>) => {
      const response = await CustomTableService.createRecord(tableId, record);

      if (response.error) {
        throw new Error(`Failed to create record: ${response.error.message}`);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.RECORDS, tableId],
      });

      if (queryKeyFromParams) {
        queryClient.invalidateQueries({
          queryKey: queryKeyFromParams,
        });
      }

      toast.success("Record created successfully");
    },
    onError: (error) => {
      console.error("Error creating record:", error);
      toast.error("Failed to create record");
    },
    ...options,
  });
};

/**
 * Hook for updating Airtable records
 */
export const useUpdateRecord = (
  tableId: string,
  options: UseMutationConfig<AirtableRecord> = {}
) => {
  const queryClient = useQueryClient();
  const queryKeyFromParams = useGetCurrentPageQueryKeyFromParams();

  return useMutation({
    mutationFn: async ({ record }: MutationFnArgs<AirtableRecord>) => {
      const response = await CustomTableService.updateRecord(
        tableId,
        record.id,
        record
      );

      if (response.error) {
        throw new Error(`Failed to update record: ${response.error.message}`);
      }
      return response.data;
    },
    onSettled: (record) => {
      console.log("onSettled", record);
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.RECORDS, tableId],
      });

      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.RECORD, tableId, record.id],
      });

      if (queryKeyFromParams) {
        queryClient.invalidateQueries({
          queryKey: queryKeyFromParams,
        });
      }

      toast.success("Record updated successfully");
    },
    onError: (error) => {
      console.error("Error updating record:", error);
      toast.error("Failed to update record");
    },
    ...options,
  });
};

/**
 * Hook for deleting Airtable records
 */
export const useDeleteRecord = (
  tableId: string,
  options: UseMutationConfig<string> = {}
) => {
  const queryClient = useQueryClient();
  const queryKeyFromParams = useGetCurrentPageQueryKeyFromParams();

  return useMutation({
    mutationFn: async ({ record }: MutationFnArgs<AirtableRecord>) => {
      const response = await CustomTableService.deleteRecord(
        tableId,
        record.id
      );

      if (response.error) {
        throw new Error(`Failed to delete record: ${response.error.message}`);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.RECORDS, tableId],
      });

      if (queryKeyFromParams) {
        queryClient.invalidateQueries({
          queryKey: queryKeyFromParams,
        });
      }

      toast.success("Record deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
    },
    ...options,
  });
};

/**
 * Hook to fetch Airtable table records
 */
export const useAirtableRecordsQuery = ({
  tableId,
  enableRealtime = false,
  queryString,
  isOptimistic = false,
}: UseAirtableQueryOptions = {}) => {
  const { tables } = useCustomTables();
  const table = tables.find((table) => table.external_id === tableId);
  const queryClient = useQueryClient();
  const dataQueryKey = useMemo(
    () => [QUERY_KEYS.RECORDS, tableId, queryString],
    [tableId, queryString]
  );

  const tableNameSingular = pluralize.singular(table?.name);

  const { data: records, ...queryResults } = useQuery({
    queryKey: dataQueryKey,
    queryFn: async () => {
      if (!tableId) {
        throw new Error("Table name is required");
      }

      const response = await CustomTableService.listRecords(
        tableId,
        queryString
      );

      if (response.error) {
        throw new Error(
          `Failed to fetch Airtable records: ${response.error.message}`
        );
      }

      return response.data as AirtableRecord[];
    },
    enabled: !!tableId,
  });

  const updateQueryData = useCallback(
    (updater: (old: AirtableRecord[]) => AirtableRecord[]) => {
      queryClient.setQueryData(dataQueryKey, updater);
    },
    [dataQueryKey, queryClient]
  );

  const addRecordToQueryData = useCallback(
    (record: AirtableRecord) => updateQueryData((old) => [...old, record]),
    [updateQueryData]
  );

  const updateRecordInQueryData = useCallback(
    (record: AirtableRecord) => {
      updateQueryData((old) =>
        old.map((r) => (r.id === record.id ? record : r))
      );
    },
    [updateQueryData]
  );

  const removeRecordFromQueryData = useCallback(
    (id: string) =>
      updateQueryData((old) => old.filter((record) => record.id !== id)),
    [updateQueryData]
  );

  const updateOptimisticRecord = useCallback(
    ({ record, options }: MutationFnArgs<AirtableRecord>) => {
      if (!isOptimistic || !options?.optimistic) return;

      toast.info(`Saving ${tableNameSingular}...`);

      if (record.id && record.id !== "temp") {
        updateRecordInQueryData(record);
      } else {
        addRecordToQueryData(record);
      }
    },
    [
      isOptimistic,
      updateRecordInQueryData,
      addRecordToQueryData,
      tableNameSingular,
    ]
  );

  const invalidateQuery = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: dataQueryKey });
  }, [dataQueryKey, queryClient]);

  const createRecordMutation = useCreateRecord(tableId, {
    onMutate: updateOptimisticRecord,
    onSettled: () => null,
    onSuccess: (record) => {
      toast.success(`${tableNameSingular} saved successfully`);

      if (record) {
        addRecordToQueryData(record);
      }
    },
  });

  const updateRecordMutation = useUpdateRecord(tableId, {
    onMutate: updateOptimisticRecord,
    onSettled: () => null,
    onSuccess: (record) => {
      toast.success(`${tableNameSingular} saved successfully`);

      if (record) {
        updateRecordInQueryData(record);
      }
    },
  });

  const deleteRecordMutation = useDeleteRecord(tableId, {
    onSettled: () => null,
    onMutate: ({ record }: MutationFnArgs<AirtableRecord>) => {
      if (!isOptimistic) return;

      toast.info(`Deleting ${tableNameSingular}...`);

      removeRecordFromQueryData(record.id);
    },
    onSuccess: (record) => {
      toast.success(`${tableNameSingular} deleted successfully`);

      removeRecordFromQueryData(record.id);
    },
  });

  return {
    ...queryResults,
    records,
    createRecord: createRecordMutation.mutateAsync,
    updateRecord: updateRecordMutation.mutateAsync,
    deleteRecord: deleteRecordMutation.mutateAsync,
    createRecordMutation,
    updateRecordMutation,
    deleteRecordMutation,
    updateOptimisticRecord,
    invalidateQuery,
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
    queryKey: [QUERY_KEYS.RECORD, tableId, recordId],
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
