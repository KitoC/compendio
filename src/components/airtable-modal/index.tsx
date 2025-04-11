import { useEffect, useState } from "react";
import { AirtableRecord, AirtableTable } from "@/types/airtable";
import { toast } from "sonner";
import FormBuilder, { FormConfig } from "@/components/form-builder";
import {
  airtableTableToFormConfig,
  createInitialValues,
} from "@/components/airtable-table/utils";
import ResponsiveModal from "@/components/ui/responsive-modal";
import {
  useAirtableRecordQuery,
  useAirtableTableSchemaQuery,
} from "@/hooks/useAirtableQuery";

export interface AirtableModalProps {
  tableId: string;
  recordId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: AirtableRecord) => Promise<void>;
  idField?: string;
  isCreating?: boolean;
  getFormConfig?: (
    config: FormConfig,
    record: AirtableRecord | null
  ) => FormConfig;
  onLoadingChange?: (isLoading: boolean) => void;
  providedTable?: AirtableTable;
  providedRecord?: AirtableRecord;
}

const AirtableModal = ({
  tableId,
  recordId,
  providedTable,
  providedRecord,
  isOpen,
  onClose,
  onSave,
  isCreating = false,
  getFormConfig,
  onLoadingChange,
}: AirtableModalProps) => {
  const isProvided = !!providedTable && !!providedRecord;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: loadedTableSchema, isLoading: isLoadingSchema } =
    useAirtableTableSchemaQuery(tableId as string);
  const { record: loadedRecord, isLoading } = useAirtableRecordQuery({
    tableId: tableId as string,
    recordId,
  });

  const record = providedRecord ? providedRecord : loadedRecord;
  const tableSchema = providedTable ? providedTable : loadedTableSchema;

  useEffect(() => {
    onLoadingChange?.(isLoadingSchema || isLoading);
  }, [isLoadingSchema, isLoading, onLoadingChange]);

  if ((isLoadingSchema || isLoading || !isOpen) && !isProvided) {
    return null;
  }

  // Generate form config from table schema
  const defaultConfig = airtableTableToFormConfig(
    tableSchema,
    record,
    isCreating
  );
  const formConfig = getFormConfig
    ? getFormConfig(defaultConfig, record)
    : defaultConfig;

  // Get initial values from record
  const initialValues = createInitialValues(record, tableSchema);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      // Create fields object for Airtable format
      const fields = { ...values };

      // If record exists, merge with existing values to preserve fields not in the form
      const updatedRecord = {
        id: record?.id || "",
        fields,
      };

      await onSave(updatedRecord as unknown as AirtableRecord);
      toast.success(
        isCreating
          ? "Record created successfully"
          : "Record updated successfully"
      );
      onClose();
    } catch (error) {
      console.error("Error saving record:", error);
      toast.error(`Failed to ${isCreating ? "create" : "update"} record`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveModal
      title={formConfig.title}
      isOpen={isOpen}
      setIsOpen={onClose}
      isSlider
      bodyClassName="!p-0"
      headerClassName="shadow-md z-10"
      footerClassName="!pb-0 shadow-md-t z-10"
    >
      <FormBuilder
        hideTitles={true}
        config={formConfig}
        onSubmit={handleSubmit}
        onCancel={onClose}
        initialValues={initialValues}
        isSubmitting={isSubmitting}
        className="border-none rounded-none shadow-none"
        buttonPortalId="slide-panel-footer-portal"
      />
    </ResponsiveModal>
  );
};

export default AirtableModal;
