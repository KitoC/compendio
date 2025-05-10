import { DataViewsService } from "@/services/DataViewsService";
import { useQuery } from "@tanstack/react-query";

export const DATA_NAVIGATION_ITEM_VIEWS_QUERY_KEY =
  "data-navigation-item-views";

export const useDataNavigationItemViewsQuery = (
  dataNavigationItemId: string
) => {
  const {
    data: dataViews = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [DATA_NAVIGATION_ITEM_VIEWS_QUERY_KEY, dataNavigationItemId],
    queryFn: () =>
      DataViewsService.getByDataNavigationItemId(dataNavigationItemId),
    enabled: !!dataNavigationItemId,
  });

  return {
    dataViews,
    isLoading,
    error,
  };
};
