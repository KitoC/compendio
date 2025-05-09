import { CustomTableSchema } from "@/types/customTable";
import { createContext, useContext, Dispatch, SetStateAction } from "react";
import { UseMutateAsyncFunction } from "@tanstack/react-query";
import { IDataView } from "@/services/DataViewsService";
import type { CustomTableRecord } from "@/types/customTable";

type MutationFunction = UseMutateAsyncFunction<
  unknown,
  Error,
  Record<string, unknown>,
  unknown
>;

export type Pagination = {
  page: number | null;
  pageSize: number;
};

export enum FilterType {
  DATE_AFTER = "date_after",
  DATE_BEFORE = "date_before",
}

export enum FilterOperator {
  AND = "AND",
  OR = "OR",
}

export type Filter = {
  filter_type: FilterOperator;
  filters: { field: string; type: FilterType; value: string }[];
};

export type Query = {
  page: number;
  pageSize: number;
  search: string;
  filter?: Filter;
};

type DataViewContextType = {
  dataView: IDataView | null;
  data: CustomTableRecord[];
  query: Query;
  setQuery: Dispatch<SetStateAction<Query>>;
  isFetchingData: boolean;
  isLoadingData: boolean;
  createRecord: MutationFunction;
  updateRecord: MutationFunction;
  deleteRecord: MutationFunction;
  onEdit: (record: CustomTableRecord) => void;
  onCreate: (record?: Partial<CustomTableRecord>) => void;
  editingRecord: CustomTableRecord | null;
  handleSave: (
    record: CustomTableRecord,
    options?: { optimistic?: boolean }
  ) => Promise<void>;
  recordToDelete: CustomTableRecord | null;
  setRecordToDelete: (record: CustomTableRecord | null) => void;
  table: CustomTableSchema;
  onRefetch: () => void;
  isRefetching: boolean;
  total: number;
  isRefreshing: boolean;
};

const defaultMutationFunction = async () => {};

const DataViewContext = createContext<DataViewContextType>({
  dataView: null,
  data: [],
  query: { page: 1, pageSize: 25, search: "" },
  setQuery: () => {},
  isFetchingData: false,
  isLoadingData: false,
  createRecord: defaultMutationFunction,
  updateRecord: defaultMutationFunction,
  deleteRecord: defaultMutationFunction,
  onEdit: () => {},
  onCreate: () => {},
  editingRecord: null,
  handleSave: defaultMutationFunction,
  recordToDelete: null,
  setRecordToDelete: () => {},
  table: null,
  onRefetch: () => {},
  isRefetching: false,
  total: 0,
  isRefreshing: false,
});

export const useDataViewContext = () => {
  const context = useContext(DataViewContext);

  if (!context) {
    throw new Error(
      "useDataViewContext must be used within a DataViewProvider"
    );
  }

  return context;
};

export default DataViewContext;
