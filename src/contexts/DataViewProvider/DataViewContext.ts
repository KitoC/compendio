import { AirtableRecord } from "@/types/airtable";
import { createContext, useContext } from "react";
import { UseMutateAsyncFunction } from "@tanstack/react-query";
import { IDataView } from "@/services/DataViewsService";

type MutationFunction = UseMutateAsyncFunction<
  unknown,
  Error,
  Record<string, unknown>,
  unknown
>;
type DataViewContextType = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataView: (IDataView & { config: any }) | null;
  data: AirtableRecord[];
  queryString: string | null;
  setQueryString: (query: string) => void;
  isFetchingData: boolean;
  isLoadingData: boolean;
  createRecord: MutationFunction;
  updateRecord: MutationFunction;
  deleteRecord: MutationFunction;
  onEdit: (record: AirtableRecord) => void;
  onCreate: (record: Partial<AirtableRecord>) => void;
  editingRecord: AirtableRecord | null;
  handleSave: (
    record: AirtableRecord,
    options?: { optimistic?: boolean }
  ) => Promise<void>;
};

const defaultMutationFunction = async () => {};

const DataViewContext = createContext<DataViewContextType>({
  dataView: null,
  data: [],
  queryString: null,
  setQueryString: () => {},
  isFetchingData: false,
  isLoadingData: false,
  createRecord: defaultMutationFunction,
  updateRecord: defaultMutationFunction,
  deleteRecord: defaultMutationFunction,
  onEdit: () => {},
  onCreate: () => {},
  editingRecord: null,
  handleSave: defaultMutationFunction,
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
