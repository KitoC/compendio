import { DEFAULT_VIEW } from "@/components/custom-tables/consts";
import { DataViewsService } from "@/services/DataViewsService";
import { QUERY_KEYS } from "./const";
import { useQuery } from "@tanstack/react-query";

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
