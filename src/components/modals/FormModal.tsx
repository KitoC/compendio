import { useState } from "react";
import FormBuilder, { FormConfig } from "@/components/form-builder";
import ResponsiveModal from "@/components/ui/responsive-modal";

export interface ServiceRecordModalProps<RecordType> {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: RecordType) => Promise<void>;
  formConfig: FormConfig;
  onLoadingChange?: (isLoading: boolean) => void;
  initialValues?: RecordType;
  renderBeforeForm?: (record: RecordType) => React.ReactNode;
}

function ServiceRecordModal<RecordType extends { id?: string }>({
  isOpen,
  onClose,
  onSave,
  initialValues,
  formConfig,
  renderBeforeForm,
}: ServiceRecordModalProps<RecordType>) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (values: Record<string, unknown>) => {
    setIsSubmitting(true);

    try {
      await onSave(values as RecordType);

      onClose();
    } catch (error) {
      console.error("Error saving record:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerId = `ct-modal-footer-${initialValues?.id || "new"}`;

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
        footerClassName="shadow-sm-top z-10"
        footerId={footerId}
        footer={<div></div>}
        onOpenAutoFocus={(e) => {
          const activeElement = document.activeElement;

          if (activeElement instanceof HTMLElement) {
            activeElement.blur();
          }
        }}
      >
        {renderBeforeForm?.(initialValues)}
        <FormBuilder
          hideTitles={true}
          config={formConfig}
          onSubmit={handleSubmit}
          onCancel={onClose}
          initialValues={initialValues}
          isSubmitting={isSubmitting}
          className="border-none rounded-none shadow-none"
          contentClassName="px-6"
          footerClassname="!pb-0 shadow-md-top z-10"
          buttonPortalId={footerId}
        />
      </ResponsiveModal>
    </div>
  );
}

export default ServiceRecordModal;
