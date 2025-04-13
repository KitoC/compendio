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
import { Alert } from "../ui/alert";
import { Bot } from "lucide-react";

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

  const aiTextItems = tableSchema.fields.filter(
    (field) => field.type === "aiText"
  );

  const lookupItems = tableSchema.fields.filter(
    (field) => field.type === "multipleLookupValues"
  );

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

      onClose();
    } catch (error) {
      console.error("Error saving record:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerId = `airtable-modal-footer-${recordId}`;

  return (
    <div
      onKeyDown={(e) => {
        e.stopPropagation();
      }}
      onKeyDownCapture={(e) => {
        e.stopPropagation();
      }}
    >
      <ResponsiveModal
        title={formConfig.title}
        isOpen={isOpen}
        setIsOpen={onClose}
        isSlider
        bodyClassName="!p-0"
        headerClassName="shadow-md z-10"
        footerClassName="!pb-0 shadow-md-t z-10"
        footerId={footerId}
        onOpenAutoFocus={(e) => {
          const activeElement = document.activeElement;

          if (activeElement instanceof HTMLElement) {
            activeElement.blur();
          }
        }}
      >
        {aiTextItems.length > 0 && (
          <div className="p-6 pb-0 bg-card">
            <Alert variant="info">
              <div className="relative">
                <div className="absolute top-0 right-0">
                  <Bot className="w-6 h-6 mb-2" />
                </div>

                {aiTextItems.map((item) => {
                  const { value } = record?.fields?.[item?.name] as {
                    value: string;
                  };

                  if (!value) return null;

                  return (
                    <div key={item.id} className="mb-2">
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{value}</p>
                    </div>
                  );
                })}
              </div>
            </Alert>
          </div>
        )}
        {lookupItems.length > 0 && (
          <div className="p-6 pb-0 bg-card">
            {lookupItems.map((item) => {
              const value = record?.fields?.[item?.name] as string;
              return (
                <div key={item.id} className="mb-2 gap-1">
                  <p className="text-muted-foreground font-bold text-sm">
                    {item.name}
                  </p>
                  <p className="text-sm">{value}</p>
                </div>
              );
            })}
          </div>
        )}
        <FormBuilder
          hideTitles={true}
          config={formConfig}
          onSubmit={handleSubmit}
          onCancel={onClose}
          initialValues={initialValues}
          isSubmitting={isSubmitting}
          className="border-none rounded-none shadow-none"
          buttonPortalId={footerId}
        />
      </ResponsiveModal>
    </div>
  );
};

export default AirtableModal;
