import { DataNavigationItemsService } from "@/services/DataNavigationItemsService";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "./consts";

export const useDataNavigationItemsQuery = () => {
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.DATA_NAVIGATION_ITEMS],
    queryFn: () => DataNavigationItemsService.getAll(),
  });

  return { data, isLoading, error };
};
