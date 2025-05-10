import { DataViewsService } from "@/services/DataViewsService";
import { useMutation } from "@tanstack/react-query";
import { IDataView } from "@/services/DataViewsService";
import { useQueryClient } from "@tanstack/react-query";
import { DATA_NAVIGATION_ITEM_VIEWS_QUERY_KEY } from "./useDataNavigationItemViewsQuery";
import { QUERY_KEYS } from "./const";

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

  const updateDataViewQueryData = (dataView: IDataView) => {
    if (dataView.id) {
      queryClient.setQueryData<IDataView>(
        [QUERY_KEYS.TABLE_NAME, dataView.id],
        dataView
      );
    }

    if (dataView.alias) {
      queryClient.setQueryData<IDataView>(
        [QUERY_KEYS.TABLE_NAME, dataView.alias],
        dataView
      );
    }
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

      updateDataViewQueryData(dataView);

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
