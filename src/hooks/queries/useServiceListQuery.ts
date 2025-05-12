import {
  useQuery,
  useMutation,
  useQueryClient,
  UseMutationResult,
  UseMutateAsyncFunction,
} from "@tanstack/react-query";
import { useState, useMemo, useCallback } from "react";
import { ServiceQuery } from "@/services/supabase/BaseService";
import pluralize from "pluralize";
import { startCase } from "lodash";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
type MutationOptions = {
  optimistic?: boolean;
};

export type MutationFnArgs<RecordType> = {
  record: RecordType;
  options?: MutationOptions;
};

type MutationFn<RecordType> = (
  record: RecordType,
  options?: MutationOptions
) => Promise<RecordType>;

export interface UseServiceListQueryOptions<RecordType> {
  tableName: string;
  uniqueKey: string;
  initialQuery: ServiceQuery;
  onFetch?: (query: ServiceQuery) => void;
  onUpsert?: MutationFn<RecordType>;
  onDelete?: MutationFn<RecordType>;
  enabled?: boolean;
  optimistic?: boolean;
}

type MutationAsyncFunction<RecordType> = UseMutateAsyncFunction<
  RecordType,
  Error,
  MutationFnArgs<RecordType>,
  void
>;

export interface UseServiceListQueryResponse<
  RecordType extends { id: string }
> {
  data: RecordType[];
  count: number;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  query: ServiceQuery;
  setQuery: (query: ServiceQuery) => void;
  upsertRecord: MutationAsyncFunction<RecordType>;
  deleteRecord: MutationAsyncFunction<RecordType>;
  upsertRecordMutation: UseMutationResult<
    RecordType,
    Error,
    MutationFnArgs<RecordType>
  >;
  deleteRecordMutation: UseMutationResult<
    RecordType,
    Error,
    MutationFnArgs<RecordType>
  >;
  updateOptimisticRecord: (args: MutationFnArgs<RecordType>) => Promise<void>;
  invalidateQuery: () => void;
}

export type ServiceListResponse<RecordType> = {
  data: RecordType[];
  count: number;
};

const TEMP_ID = "temp";

/**
 * Hook to fetch Custom table records
 */
export function useServiceListQuery<RecordType extends { id: string }>({
  tableName,
  uniqueKey,
  initialQuery,
  onFetch,
  onUpsert,
  onDelete,
  enabled = true,
  optimistic = true,
}: UseServiceListQueryOptions<RecordType>): UseServiceListQueryResponse<RecordType> {
  const { tenantId } = useTenant();
  const [query, setQuery] = useState<ServiceQuery>(initialQuery);
  const [editingRecord, setEditingRecord] = useState<RecordType | null>(null);

  const queryClient = useQueryClient();
  const dataQueryKey = useMemo(
    () => [tableName, query, uniqueKey],
    [tableName, query, uniqueKey]
  );

  const tableNameSingular = pluralize.singular(startCase(tableName));

  const {
    data: { data = [], count } = { data: [], count: 0 },
    ...queryResults
  } = useQuery({
    placeholderData: (previousData, previousQuery) => {
      if (previousQuery?.queryKey?.[2] === uniqueKey) {
        return previousData;
      }

      return undefined;
    },
    queryKey: dataQueryKey,
    queryFn: () => onFetch?.(query),
    enabled: !!onFetch && enabled,
    // keepPreviousData: true,
  });

  const updateQueryData = useCallback(
    (
      updater: (
        old: ServiceListResponse<RecordType>
      ) => ServiceListResponse<RecordType>
    ) => {
      queryClient.setQueryData(dataQueryKey, updater);
    },
    [dataQueryKey, queryClient]
  );

  const addRecordToQueryData = useCallback(
    (record: RecordType) =>
      updateQueryData((old) => {
        return {
          ...old,
          data: [...old.data, record],
          count: old.count + 1,
        };
      }),
    [updateQueryData]
  );

  const updateRecordInQueryData = useCallback(
    (record: RecordType) => {
      updateQueryData((old) => {
        return {
          ...old,
          data: old.data.map((r) => (r.id === record.id ? record : r)),
        };
      });
    },
    [updateQueryData]
  );

  const removeRecordFromQueryData = useCallback(
    (id: string) =>
      updateQueryData((old) => {
        return {
          ...old,
          data: old.data.filter((record) => record.id !== id),
          count: old.count - 1,
        };
      }),
    [updateQueryData]
  );

  const updateOptimisticRecord = useCallback(
    async ({ record, options }: MutationFnArgs<RecordType>) => {
      if (!optimistic && !options?.optimistic) return;

      await queryClient.cancelQueries({ queryKey: dataQueryKey });

      toast.info(`Saving ${tableNameSingular}...`);

      if (record.id && record.id !== TEMP_ID) {
        updateRecordInQueryData(record);
      } else {
        addRecordToQueryData(record);
      }
    },
    [
      optimistic,
      updateRecordInQueryData,
      addRecordToQueryData,
      tableNameSingular,
      queryClient,
      dataQueryKey,
    ]
  );

  const invalidateQuery = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: dataQueryKey });
  }, [dataQueryKey, queryClient]);

  const upsertRecordMutation = useMutation({
    mutationFn: ({ record, options }: MutationFnArgs<RecordType>) =>
      onUpsert?.({ ...record, tenant_id: tenantId }, options),
    onMutate: updateOptimisticRecord,
    onSettled: () => null,
    onSuccess: () => {
      toast.success(`${tableNameSingular} saved successfully`);
      // invalidateQuery();
    },
  });

  const deleteRecordMutation = useMutation({
    mutationFn: ({ record, options }: MutationFnArgs<RecordType>) =>
      onDelete?.(record, options),
    onSettled: () => null,
    onMutate: ({ record }: MutationFnArgs<RecordType>) => {
      if (!optimistic) return;

      toast.info(`Deleting ${tableNameSingular}...`);

      removeRecordFromQueryData(record.id);
    },
    onSuccess: (record: RecordType) => {
      toast.success(`${tableNameSingular} deleted successfully`);

      if (record) {
        removeRecordFromQueryData(record.id);
      }
    },
  });

  return {
    ...queryResults,
    isLoading: !queryResults.isPlaceholderData && queryResults.isFetching,
    data,
    upsertRecord: upsertRecordMutation.mutateAsync,
    deleteRecord: deleteRecordMutation.mutateAsync,
    upsertRecordMutation,
    deleteRecordMutation,
    updateOptimisticRecord,
    invalidateQuery,
    count,
    query,
    setQuery,
  };
}
