import { useCallback, useEffect, useMemo, useState } from "react";
import DataViewContext, { Pagination, Query } from "./DataViewContext";
import { useDataViewQuery } from "@/hooks/DataViews";
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
import { IDataView, ViewType } from "@/services/DataViewsService";
import useDataViewQueryBuilder from "./useDataViewQueryBuilder";
import DataViewModal from "@/components/DataViewModal";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

type DataViewProviderProps = {
  children: React.ReactNode;
  dataViewId: string;
  tableId?: string;
};

export const TEMP_RECORD_ID = "temp";

const isDataViewEnabled = (dataView: IDataView, query: Query) => {
  if (!dataView) {
    return false;
  }

  if (dataView.view_type === ViewType.Calendar) {
    return query.filter?.filters.length > 0;
  }

  return true;
};

const DataViewProvider = ({
  children,
  dataViewId,
  tableId: tableIdFromProps,
}: DataViewProviderProps) => {
  const [isEditingDataView, setIsEditingDataView] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CustomTableRecord | null>(
    null
  );
  const [dataNavigationPageActionsEl, setDataNavigationPageActionsEl] =
    useState<HTMLDivElement | null>(null);
  const [recordToDelete, setRecordToDelete] =
    useState<CustomTableRecord | null>(null);

  const { dataView, isFetching: isFetchingDataView } =
    useDataViewQuery(dataViewId);

  const { query, setQuery, queryString } = useDataViewQueryBuilder(dataView);

  const tableId = tableIdFromProps || dataView?.external_table_id;

  const { data: table, isLoading: isLoadingTable } =
    useCustomTableSchemaQuery(tableId);

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
    dataViewId,
    enabled: isDataViewEnabled(dataView, query),
  });

  const handleSave = useCallback(
    async (record: CustomTableRecord, options?: { optimistic?: boolean }) => {
      try {
        if (isCreating || !record._id || record._id === TEMP_RECORD_ID) {
          createRecord({ record, options: { optimistic: true } });
        } else {
          updateRecord({ record, options: { optimistic: true } });
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

  const onEditDataView = useCallback(() => {
    setIsEditingDataView(true);
  }, []);

  useEffect(() => {
    if (dataNavigationPageActionsEl) return;

    setTimeout(() => {
      const el = document.getElementById("data-navigation-page-actions");
      if (el) {
        setDataNavigationPageActionsEl(el as HTMLDivElement);
      }
    }, 0);
  }, [dataNavigationPageActionsEl]);

  const value = useMemo(() => {
    return {
      dataView,
      query,
      setQuery,
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
      onEditDataView,
    };
  }, [
    dataView,
    query,
    setQuery,
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
    onEditDataView,
  ]);

  return (
    <DataViewContext.Provider value={value}>
      {isFetchingDataView || isLoadingTable ? (
        <div className="flex justify-center items-center h-full">
          <Loader />
        </div>
      ) : (
        <>
          {dataNavigationPageActionsEl &&
            createPortal(
              <div id="data-navigation-page-actions">
                <Button
                  size="icon-only"
                  variant="ghost"
                  onClick={onEditDataView}
                >
                  <Settings />
                </Button>
              </div>,
              dataNavigationPageActionsEl
            )}
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
          <DataViewModal
            open={isEditingDataView}
            setOpen={setIsEditingDataView}
            tableId={table.id}
            dataViewId={dataView.id}
            key={dataView.id}
            onSuccess={() => setIsEditingDataView(false)}
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
