import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  DataViewsService,
  DATA_VIEWS_TABLE_NAME,
  DataViewCreate,
  DataViewUpdate,
  IDataView,
} from "@/services/DataViewsService";
import { DATA_NAVIGATION_ITEM_VIEWS_QUERY_KEY } from "./DataViews/useDataNavigationItemViewsQuery";
import { toast } from "sonner";

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

const TEMP_VIEW_ID = "temp";

/**
 * Hook to create or update data view
 */
export const useCreateOrUpdateDataViewMutation = ({
  onSuccess,
  onMutate,
}: {
  onSuccess?: (dataView: IDataView) => void;
  onMutate?: (dataView: IDataView) => void;
} = {}) => {
  const queryClient = useQueryClient();

  const updateNavigationItemViewsQueryData = (
    dataView: IDataView,
    updater: (old: IDataView[]) => IDataView[]
  ) => {
    queryClient.setQueryData<IDataView[]>(
      [DATA_NAVIGATION_ITEM_VIEWS_QUERY_KEY, dataView.data_navigation_item_id],
      updater
    );
  };

  return useMutation({
    mutationFn: async (dataView: IDataView) => {
      if (dataView.id) {
        return DataViewsService.update(dataView);
      } else {
        return DataViewsService.create(dataView);
      }
    },
    onMutate: async (dataView: IDataView) => {
      updateNavigationItemViewsQueryData(dataView, (old: IDataView[]) => {
        if (dataView.id) {
          return old.map((view) =>
            view.id === dataView.id ? (dataView as IDataView) : view
          );
        }

        return [...old, { ...dataView, id: TEMP_VIEW_ID } as IDataView];
      });

      onMutate?.(dataView);
    },
    onError: (error, dataView) => {
      updateNavigationItemViewsQueryData(dataView, (old: IDataView[]) => {
        return old.filter((view) => view.id !== TEMP_VIEW_ID);
      });
    },
    onSuccess: async (dataView: IDataView) => {
      updateNavigationItemViewsQueryData(dataView, (old: IDataView[]) => {
        if (!dataView.id) {
          return old.map((view) =>
            view.id === TEMP_VIEW_ID ? (dataView as IDataView) : view
          );
        }
      });

      onSuccess?.(dataView);
    },
  });
};

export const useDeleteDataViewMutation = () => {
  const queryClient = useQueryClient();

  const updateNavigationItemViewsQueryData = (
    dataView: IDataView,
    updater: (old: IDataView[]) => IDataView[]
  ) => {
    queryClient.setQueryData<IDataView[]>(
      [DATA_NAVIGATION_ITEM_VIEWS_QUERY_KEY, dataView.data_navigation_item_id],
      updater
    );
  };

  return useMutation({
    mutationFn: DataViewsService.delete,
    onMutate: async (dataView: IDataView) => {
      toast.info("Deleting view...");

      updateNavigationItemViewsQueryData(dataView, (old: IDataView[]) => {
        return old.filter((view) => view.id !== dataView.id);
      });
    },
    onSuccess: () => {
      toast.success("View deleted successfully");
    },
  });
};
