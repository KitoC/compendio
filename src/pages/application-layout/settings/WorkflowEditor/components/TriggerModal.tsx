import ResponsiveModal from "@/components/ui/responsive-modal";
import {
  getTriggerText,
  TRIGGER_FORM_CONFIGS,
  TRIGGER_OPTIONS,
  TRIGGER_DESCRIPTION,
} from "../consts/triggers";
import { useState, useEffect } from "react";
import FormBuilder from "@/components/form-builder";
import TriggerSelect from "./TriggerSelect";
import { useCustomTables } from "@/contexts/CustomTables";
import { FormFieldType } from "@/components/form-builder/types";
import { useWorkflowEditor } from "@/contexts/WorkflowEditorProvider";

const TriggerModal = ({ isOpen, onClose, id }) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const { workflow, updateWorkflow } = useWorkflowEditor();

  const trigger = workflow.triggers.find((t) => t.id === id);

  const [isPersisting, setIsPersisting] = useState(false);

  const { tables } = useCustomTables();

  const triggerText = getTriggerText(trigger, tables).plainText;

  const triggerFormConfig = TRIGGER_FORM_CONFIGS[trigger?.event_type];
  const triggerDescription = TRIGGER_DESCRIPTION[trigger?.event_type];

  useEffect(() => {
    const container = document.getElementById("workflow-editor-container");
    setContainer(container);
  }, []);

  if (!container) {
    return null;
  }

  return (
    <ResponsiveModal
      title={triggerText.replace(/\*\*/g, "").trim()}
      isOpen={isOpen}
      setIsOpen={onClose}
      isSlider
      hideOverlay
      className="sm:max-w-md md:max-w-xl shadow-lg p-0 bg-card"
      bodyClassName="p-0 px-0"
      onPointerDownOutside={(e) => {
        e.preventDefault();
      }}
      container={container}
    >
      {trigger && (
        <FormBuilder
          className="pt-0 rounded-none border-none shadow-none"
          contentClassName="px-0 py-0 !space-y-0 shadow-none"
          footerClassname="py-0 shadow-none"
          hideSubmitButton
          submitOnChange={true}
          config={{
            id: "trigger-configuration",
            sections: [
              {
                id: "trigger-configuration",
                fields: [
                  {
                    type: "select" as FormFieldType,
                    id: "event_type",
                    name: "event_type",
                    label: "Trigger type",
                    options: TRIGGER_OPTIONS,
                    description: triggerDescription,
                    CustomComponent: (props) => (
                      <TriggerSelect
                        {...props}
                        onChange={(value) => {
                          props.onChange(props.name, value);
                        }}
                      />
                    ),
                  },
                ],
              },
              ...(triggerFormConfig?.getSections({ tables, trigger }) || []),
            ].map((section) => ({
              ...section,
              className:
                "border-b py-6 px-4 !space-y-0  last:border-b-transparent",
            })),
          }}
          isSubmitting={isPersisting}
          onSubmit={async ({ event_type, ...metadata }) => {
            setIsPersisting(true);

            updateWorkflow({
              ...workflow,
              triggers: workflow.triggers.map((t) =>
                t.id === id
                  ? { ...t, event_type: event_type as string, metadata }
                  : t
              ),
            });

            setIsPersisting(false);
          }}
          initialValues={{
            event_type: trigger?.event_type,
            ...(trigger.metadata as object),
          }}
        />
      )}
    </ResponsiveModal>
  );
};

export default TriggerModal;
