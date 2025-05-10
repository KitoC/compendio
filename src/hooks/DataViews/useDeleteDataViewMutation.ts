import { IDataView } from "@/services/DataViewsService";
import { DataViewsService } from "@/services/DataViewsService";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DATA_NAVIGATION_ITEM_VIEWS_QUERY_KEY } from "./useDataNavigationItemViewsQuery";

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
