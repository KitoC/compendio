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

type DataViewContextType = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataView: (IDataView & { config: any }) | null;
  data: CustomTableRecord[];
  query: string | null;
  setQuery: Dispatch<SetStateAction<string>>;
  pagination: Pagination;
  setPagination: Dispatch<SetStateAction<Pagination>>;
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
  query: null,
  setQuery: () => {},
  pagination: { page: 1, pageSize: 10 },
  setPagination: () => {},
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
