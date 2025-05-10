import { DataNavigationItemsService } from "@/services/DataNavigationItemsService";
import { useQuery } from "@tanstack/react-query";

export const useDataNavigationItemsQuery = () => {
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["data-navigation-items"],
    queryFn: () => DataNavigationItemsService.getAll(),
  });

  return { data, isLoading, error };
};
