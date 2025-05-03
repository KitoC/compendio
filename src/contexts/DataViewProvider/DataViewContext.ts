import { AirtableRecord, AirtableTable } from "@/types/airtable";
import { createContext, useContext, Dispatch, SetStateAction } from "react";
import { UseMutateAsyncFunction } from "@tanstack/react-query";
import { IDataView } from "@/services/DataViewsService";

type MutationFunction = UseMutateAsyncFunction<
  unknown,
  Error,
  Record<string, unknown>,
  unknown
>;

export type Pagination = {
  offset: string | null;
  pageSize: number;
};

type DataViewContextType = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataView: (IDataView & { config: any }) | null;
  data: AirtableRecord[];
  query: string | null;
  setQuery: Dispatch<SetStateAction<string>>;
  pagination: Pagination;
  setPagination: Dispatch<SetStateAction<Pagination>>;
  isFetchingData: boolean;
  isLoadingData: boolean;
  createRecord: MutationFunction;
  updateRecord: MutationFunction;
  deleteRecord: MutationFunction;
  onEdit: (record: AirtableRecord) => void;
  onCreate: (record?: Partial<AirtableRecord>) => void;
  editingRecord: AirtableRecord | null;
  handleSave: (
    record: AirtableRecord,
    options?: { optimistic?: boolean }
  ) => Promise<void>;
  recordToDelete: AirtableRecord | null;
  setRecordToDelete: (record: AirtableRecord | null) => void;
  table: AirtableTable;
  onRefetch: () => void;
  isRefetching: boolean;
};

const defaultMutationFunction = async () => {};

const DataViewContext = createContext<DataViewContextType>({
  dataView: null,
  data: [],
  query: null,
  setQuery: () => {},
  pagination: { offset: null, pageSize: 10 },
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
