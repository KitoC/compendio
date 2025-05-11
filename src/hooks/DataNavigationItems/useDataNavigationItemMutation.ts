import {
  DataNavigationItem,
  DataNavigationItemsService,
} from "@/services/DataNavigationItemsService";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "./consts";
import { kebabCase } from "lodash";

const TEMP_ID = "temp-id";

export const useDataNavigationItemMutation = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: mutate,
    isPending,
    error,
  } = useMutation({
    mutationFn: (payload: DataNavigationItem) =>
      DataNavigationItemsService.createOrUpdate({
        ...payload,
        path: kebabCase(payload.name),
      }),

    onMutate: (payload: DataNavigationItem) => {
      queryClient.setQueryData(
        [QUERY_KEYS.DATA_NAVIGATION_ITEMS],
        (old: DataNavigationItem[]) => {
          if (!payload.id) {
            return [...old, { ...payload, id: TEMP_ID }];
          }

          return old.map((item) => (item.id === payload.id ? payload : item));
        }
      );
    },

    onSuccess: (data: DataNavigationItem) => {
      queryClient.setQueryData(
        [QUERY_KEYS.DATA_NAVIGATION_ITEMS],
        (old: DataNavigationItem[]) => {
          return old.map((item) => (item.id === TEMP_ID ? data : item));
        }
      );
    },
  });

  return { mutate, isPending, error };
};
