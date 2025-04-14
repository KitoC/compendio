// NO_CHANGE

import { useState } from "react";
import { EditModalProps } from "./types";
import { toast } from "sonner";
import FormBuilder from "@/components/form-builder";
import { columnsToFormConfig, createInitialValues } from "./utils";
import ResponsiveModal from "../ui/responsive-modal";

function EditModal<T extends Record<string, unknown>>({
  isOpen,
  onClose,
  item,
  onSave,
  columns,
  idField,
  isCreating = false,
  getFormConfig = (config) => config,
}: EditModalProps<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate form config from columns
  const formConfig = getFormConfig(
    columnsToFormConfig(columns, (item || {}) as T, {
      title: isCreating ? "Create New Item" : "Edit Item",
      formId: "data-table-edit-form",
      includeHiddenColumns: false,
      submitButtonText: "Save",
      cancelButtonText: "Cancel",
      showReset: false,
    }),
    item
  );

  // Get initial values from item
  const initialValues = item ? createInitialValues(item, columns) : {};

  const handleSubmit = async (values: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      // If item exists, merge with existing values to preserve fields not in the form
      const updatedItem = item
        ? { ...item, ...values, [idField]: item[idField] }
        : { ...values };

      await onSave(updatedItem as T);
      toast.success(
        isCreating ? "Item created successfully" : "Item updated successfully"
      );
      onClose();
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error(`Failed to ${isCreating ? "create" : "update"} item`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      isSlider
      setIsOpen={(open) => !open && onClose()}
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
    </ResponsiveModal>
  );
}

export default EditModal;
