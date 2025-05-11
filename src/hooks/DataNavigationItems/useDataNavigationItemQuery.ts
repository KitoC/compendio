import { DataNavigationItemsService } from "@/services/DataNavigationItemsService";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "./consts";

export const useDataNavigationItemQuery = (dataNavigationPath: string) => {
  const { data, isLoading, error, ...rest } = useQuery({
    queryKey: [QUERY_KEYS.DATA_NAVIGATION_ITEMS, dataNavigationPath],
    queryFn: () => DataNavigationItemsService.getByPath(dataNavigationPath),
  });

  return { data, isLoading, error };
};
