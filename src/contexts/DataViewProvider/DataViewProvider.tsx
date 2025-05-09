import { useCallback, useMemo, useState } from "react";
import DataViewContext, { Pagination } from "./DataViewContext";
import { useDataViewQuery } from "@/hooks/useDataViewsQuery";
import {
  useCustomRecordsQuery,
  useCustomTableSchemaQuery,
} from "@/hooks/useCustomTableQuery";
import Loader from "@/components/ui/loader";
import CustomTableModal from "@/components/custom-tables/CustomTableModal";
import { CustomTableRecord } from "@/types/customTable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 25,
  });
  const [query, setQuery] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CustomTableRecord | null>(
    null
  );
  const [recordToDelete, setRecordToDelete] =
    useState<CustomTableRecord | null>(null);

  const { dataView, isFetching: isFetchingDataView } =
    useDataViewQuery(dataViewId);

  const tableId = tableIdFromProps || dataView?.external_table_id;

  const { data: table } = useCustomTableSchemaQuery(tableId);

  const queryString = useMemo(() => {
    let string = "";

    if (pagination.page) {
      string += `page=${pagination.page}`;
    }

    if (pagination.pageSize) {
      string += `&pageSize=${pagination.pageSize}`;
    }

    if (query) {
      string += `&${query}`;
    }

    return string;
  }, [pagination.page, pagination.pageSize, query]);

  const {
    records,
    isFetching: isFetchingData,
    isLoading: isLoadingData,
    createRecord,
    updateRecord,
    deleteRecord,
    invalidateQuery,
    refetch,
    isRefetching,
    total,
  } = useCustomRecordsQuery({
    tableId,
    queryString,
    isOptimistic: true,
  });

  const handleSave = useCallback(
    async (record: CustomTableRecord, options?: { optimistic?: boolean }) => {
      try {
        if (isCreating || !record._id || record._id === TEMP_RECORD_ID) {
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

  const handleDeleteConfirm = useCallback(() => {
    if (recordToDelete) {
      deleteRecord({ record: recordToDelete });
    }
  }, [recordToDelete, deleteRecord]);

  const onEdit = useCallback((record: CustomTableRecord) => {
    setEditingRecord(record);
    setIsCreating(false);
  }, []);

  const onCreate = useCallback((record?: CustomTableRecord | null) => {
    setEditingRecord(record);
    setIsCreating(true);
  }, []);

  const onRefetch = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const value = useMemo(() => {
    return {
      dataView,
      query,
      setQuery,
      pagination,
      setPagination,
      data: records || [],
      isFetchingData,
      isLoadingData,
      createRecord,
      updateRecord,
      deleteRecord,
      onEdit,
      onCreate,
      editingRecord,
      handleSave,
      recordToDelete,
      setRecordToDelete,
      table,
      onRefetch,
      isRefetching,
      isRefreshing,
      total,
    };
  }, [
    dataView,
    query,
    setQuery,
    pagination,
    setPagination,
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
    recordToDelete,
    setRecordToDelete,
    table,
    onRefetch,
    isRefetching,
    isRefreshing,
    total,
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
          <CustomTableModal
            providedTable={table}
            providedRecord={editingRecord}
            tableId={table?.external_id}
            recordId={editingRecord?._id}
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
          <AlertDialog
            open={recordToDelete !== null}
            onOpenChange={(open) => !open && setRecordToDelete(null)}
          >
            <AlertDialogContent className="animate-fade-in">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  this record.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </DataViewContext.Provider>
  );
};

export default DataViewProvider;
