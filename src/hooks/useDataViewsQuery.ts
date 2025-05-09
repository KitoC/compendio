import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  DataViewsService,
  DATA_VIEWS_TABLE_NAME,
  DataViewCreate,
  DataViewUpdate,
  IDataView,
} from "@/services/DataViewsService";

const QUERY_KEYS = {
  TABLE_NAME: DATA_VIEWS_TABLE_NAME,
};

/**
 * Hook to fetch data views
 */
export const useDataViewsQuery = (tableId: string) => {
  const { data: dataViews = [], ...queryResults } = useQuery({
    queryKey: [QUERY_KEYS.TABLE_NAME, tableId],

    queryFn: async () => DataViewsService.getDataViewsByTableId(tableId),
    // placeholderData: [],
  });

  return {
    ...queryResults,
    dataViews,
  };
};

export const DEFAULT_VIEW: DataViewCreate = {
  id: "default",
  label: "List view",
  view_type: "grid",
  config: {},
  created_at: new Date().toISOString(),
  deleted_at: null,
  external_table_id: null,
  data_table_id: null,
  tenant_id: null,
};

/**
 * Hook to fetch data view
 */
export const useDataViewQuery = (id: string) => {
  const { data: dataView, ...queryResults } = useQuery({
    queryKey: [QUERY_KEYS.TABLE_NAME, id],

    queryFn: async () => DataViewsService.getById(id),
    enabled: !!id && id !== "default",
  });

  if (id === "default") {
    return {
      dataView: { ...DEFAULT_VIEW },
      isFetching: false,
    };
  }

  return {
    ...queryResults,
    dataView,
  };
};

/**
 * Hook to create or update data view
 */
export const useCreateOrUpdateDataViewMutation = (
  tableId: string,
  onSuccess?: (dataView: IDataView) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dataView: DataViewCreate | DataViewUpdate) => {
      if (dataView.id) {
        return DataViewsService.update(dataView);
      } else {
        return DataViewsService.create(dataView);
      }
    },
    onSuccess: async (dataView: IDataView) => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.TABLE_NAME, tableId],
      });
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.TABLE_NAME, dataView.id],
      });

      onSuccess?.(dataView);
    },
  });
};

export const useDeleteDataViewMutation = (tableId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => DataViewsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.TABLE_NAME, tableId],
      });
    },
  });
};
