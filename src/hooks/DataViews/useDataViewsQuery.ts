import { DataViewsService } from "@/services/DataViewsService";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "./const";

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
