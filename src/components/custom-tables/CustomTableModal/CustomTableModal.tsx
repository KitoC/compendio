import { useEffect, useState } from "react";
import type { CustomTableRecord, CustomTableSchema } from "@/types/customTable";
import FormBuilder, { FormConfig } from "@/components/form-builder";
import { customTableToFormConfig } from "@/components/custom-tables/utils";
import ResponsiveModal from "@/components/ui/responsive-modal";
import {
  useCustomRecordQuery,
  useCustomTableSchemaQuery,
} from "@/hooks/useCustomTableQuery";
import { Alert } from "@/components/ui/alert";
import { Bot } from "lucide-react";
import { useSystemSettings } from "@/contexts/SystemSettingsProvider";
import { useUserSettings } from "@/contexts/UserSettingsProvider";
import ReadonlyFields from "./ReadonlyFields";

export interface CustomTableModalProps {
  tableId: string;
  recordId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: CustomTableRecord) => Promise<void>;
  idField?: string;
  isCreating?: boolean;
  getFormConfig?: (
    config: FormConfig,
    record: CustomTableRecord | null
  ) => FormConfig;
  onLoadingChange?: (isLoading: boolean) => void;
  providedTable?: CustomTableSchema;
  providedRecord?: CustomTableRecord;
}

const CustomTableModal = ({
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
}: CustomTableModalProps) => {
  const systemSettings = useSystemSettings();
  const { timeSettings } = useUserSettings();
  const isProvided = !!providedTable && !!providedRecord;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: loadedTableSchema, isLoading: isLoadingSchema } =
    useCustomTableSchemaQuery(tableId as string);
  const { record: loadedRecord, isLoading } = useCustomRecordQuery({
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

  const readonlyItems = tableSchema.fields.filter((field) => field.is_readonly);

  // Generate form config from table schema
  const defaultConfig = customTableToFormConfig(
    tableSchema,
    record,
    isCreating,
    systemSettings
  );
  const formConfig = getFormConfig
    ? getFormConfig(defaultConfig, record)
    : defaultConfig;

  const handleSubmit = async (values: CustomTableRecord) => {
    setIsSubmitting(true);

    try {
      await onSave(values);

      onClose();
    } catch (error) {
      console.error("Error saving record:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerId = `ct-modal-footer-${recordId}`;

  const aiTextItemValues = aiTextItems
    .map((item) => {
      const { value } =
        (record?.[item?.name] as {
          value: string;
        }) || {};

      return { name: item?.name, value };
    })
    .filter((item) => item.value);

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
        footerClassName="!pb-0 shadow-md-top z-10"
        footerId={footerId}
        onOpenAutoFocus={(e) => {
          const activeElement = document.activeElement;

          if (activeElement instanceof HTMLElement) {
            activeElement.blur();
          }
        }}
      >
        {aiTextItemValues.length > 0 && (
          <div className="p-6 pb-0 bg-card">
            <Alert variant="info">
              <div className="relative flex flex-col gap-2">
                <div className="absolute top-0 right-0">
                  <Bot className="w-6 h-6 mb-2" />
                </div>

                {aiTextItemValues.map((item) => {
                  return (
                    <div key={item.name} className="">
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.value || "-"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Alert>
          </div>
        )}
        <ReadonlyFields readonlyItems={readonlyItems} record={record} />
        <FormBuilder
          hideTitles={true}
          config={formConfig}
          onSubmit={handleSubmit}
          onCancel={onClose}
          initialValues={record}
          isSubmitting={isSubmitting}
          className="border-none rounded-none shadow-none"
          contentClassName="px-6"
          buttonPortalId={footerId}
        />
      </ResponsiveModal>
    </div>
  );
};

export default CustomTableModal;
