import { useCallback, useMemo, useState } from "react";
import DataViewContext from "./DataViewContext";
import { useDataViewQuery } from "@/hooks/useDataViewsQuery";
import {
  useAirtableRecordsQuery,
  useAirtableTableSchemaQuery,
} from "@/hooks/useAirtableQuery";
import Loader from "@/components/ui/loader";
import AirtableModal from "@/components/airtable-modal";
import { AirtableRecord } from "@/types/airtable";

type DataViewProviderProps = {
  children: React.ReactNode;
  dataViewId: string;
  tableId?: string;
};

export const TEMP_RECORD_ID = "temp";

const DataViewProvider = ({
  children,
  dataViewId,
  tableId: tableIdFromProps,
}: DataViewProviderProps) => {
  const [queryString, setQueryString] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AirtableRecord | null>(
    null
  );

  const { dataView, isFetching: isFetchingDataView } =
    useDataViewQuery(dataViewId);

  const tableId = tableIdFromProps || dataView?.external_table_id;

  const { data: table } = useAirtableTableSchemaQuery(tableId);

  const {
    records,
    isFetching: isFetchingData,
    isLoading: isLoadingData,
    createRecord,
    updateRecord,
    deleteRecord,
    invalidateQuery,
  } = useAirtableRecordsQuery({ tableId, queryString, isOptimistic: true });

  const handleSave = useCallback(
    async (record: AirtableRecord, options?: { optimistic?: boolean }) => {
      try {
        if (isCreating || !record.id || record.id === TEMP_RECORD_ID) {
          await createRecord({ record, options });
        } else {
          await updateRecord({ record, options });
        }
      } catch (error) {
        console.error("Error saving record:", error);
        throw error;
      }
    },
    [isCreating, createRecord, updateRecord]
  );

  const onEdit = useCallback((record: AirtableRecord) => {
    setEditingRecord(record);
    setIsCreating(false);
  }, []);

  const onCreate = useCallback((record: AirtableRecord | null) => {
    setEditingRecord(record);
    setIsCreating(true);
  }, []);

  const value = useMemo(() => {
    return {
      dataView,
      queryString,
      setQueryString,
      data: records,
      isFetchingData,
      isLoadingData,
      createRecord,
      updateRecord,
      deleteRecord,
      onEdit,
      onCreate,
      editingRecord,
      handleSave,
    };
  }, [
    dataView,
    queryString,
    setQueryString,
    records,
    isFetchingData,
    isLoadingData,
    createRecord,
    updateRecord,
    deleteRecord,
    onEdit,
    onCreate,
    editingRecord,
    handleSave,
  ]);

  return (
    <DataViewContext.Provider value={value}>
      {isFetchingDataView ? (
        <div className="flex justify-center items-center h-full">
          <Loader />
        </div>
      ) : (
        <>
          {children}{" "}
          <AirtableModal
            providedTable={table}
            providedRecord={editingRecord}
            tableId={table?.external_id}
            recordId={editingRecord?.id}
            isCreating={isCreating}
            // getFormConfig={getFormConfig}
            onSave={handleSave}
            onClose={() => {
              setEditingRecord(null);
              setIsCreating(false);
              invalidateQuery();
            }}
            isOpen={isCreating || editingRecord !== null}
          />
        </>
      )}
    </DataViewContext.Provider>
  );
};

export default DataViewProvider;
