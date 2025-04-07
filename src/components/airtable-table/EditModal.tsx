
import { useState } from "react";
import { EditModalProps } from "./types";
import { toast } from "sonner";
import { SlidePanel } from "../ui/slide-panel";
import FormBuilder from "@/components/form-builder";
import { airtableTableToFormConfig, createInitialValues } from "./utils";

const EditModal = ({
  isOpen,
  onClose,
  record,
  table,
  onSave,
  idField,
  isCreating = false,
  getFormConfig,
}: EditModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate form config from table schema
  const defaultConfig = airtableTableToFormConfig(table, record, isCreating);
  const formConfig = getFormConfig ? getFormConfig(defaultConfig, record) : defaultConfig;

  // Get initial values from record
  const initialValues = createInitialValues(record, table);

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

      await onSave(updatedRecord as any);
      toast.success(
        isCreating ? "Record created successfully" : "Record updated successfully"
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
    <SlidePanel
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={formConfig.title}
      description={formConfig.description}
      footer={<div></div>}
    >
      <FormBuilder
        hideTitles={true}
        config={formConfig}
        onSubmit={handleSubmit}
        onCancel={onClose}
        initialValues={initialValues}
        isSubmitting={isSubmitting}
        className="border-none shadow-none p-0"
        buttonPortalId="slide-panel-footer-portal"
      />
    </SlidePanel>
  );
};

export default EditModal;
