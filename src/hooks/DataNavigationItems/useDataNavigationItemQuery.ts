import { DataNavigationItemsService } from "@/services/DataNavigationItemsService";
import { useQuery } from "@tanstack/react-query";

export const useDataNavigationItemQuery = (dataNavigationPath: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["data-navigation-item", dataNavigationPath],
    queryFn: () => DataNavigationItemsService.getByPath(dataNavigationPath),
  });

  return { data, isLoading, error };
};
