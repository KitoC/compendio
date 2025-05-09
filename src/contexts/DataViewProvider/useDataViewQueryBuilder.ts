import { useMemo, useState } from "react";
import { ViewType } from "@/services/DataViewsService";
import { IDataView } from "@/services/DataViewsService";
import { Query } from "./DataViewContext";
import { useDebounce } from "use-debounce";

const useDataViewQueryBuilder = (dataView: IDataView) => {
  const [query, setQuery] = useState<Query>({
    page: 1,
    pageSize: 25,
    search: "",
  });
  const [debouncedQuery] = useDebounce(query, 500);

  const queryString = useMemo(() => {
    let string = "";

    if ([ViewType.Grid].includes(dataView?.view_type)) {
      if (debouncedQuery.page) {
        string += `page=${debouncedQuery.page}`;
      }

      if (debouncedQuery.pageSize) {
        string += `&pageSize=${debouncedQuery.pageSize}`;
      }
    }

    if (debouncedQuery.search) {
      string += `&search=${debouncedQuery.search}`;
    }

    if (debouncedQuery.filter) {
      string += `&filter=${JSON.stringify(debouncedQuery.filter)}`;
    }

    return string;
  }, [debouncedQuery, dataView]);

  return { query, setQuery, queryString };
};

export default useDataViewQueryBuilder;
