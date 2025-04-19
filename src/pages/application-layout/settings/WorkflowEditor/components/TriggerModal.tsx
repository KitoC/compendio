import ResponsiveModal from "@/components/ui/responsive-modal";
import { useWorkflowTriggerQuery } from "@/hooks/useWorkflowsQuery";
import {
  getTriggerText,
  TIGGER_FORM_CONFIGS,
  TRIGGER_OPTIONS,
} from "../consts/triggers";
import { useState, useEffect } from "react";
import FormBuilder from "@/components/form-builder";
import TriggerSelect from "./TriggerSelect";
import { useCustomTables } from "@/contexts/CustomTables";
import { FormFieldType } from "@/components/form-builder/types";

const TriggerModal = ({ isOpen, onClose, id }) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const { data: trigger, updateTrigger } = useWorkflowTriggerQuery(id);
  const [isPersisting, setIsPersisting] = useState(false);

  const { tables } = useCustomTables();

  const triggerText = getTriggerText(trigger, tables);

  const triggerFormConfig = TIGGER_FORM_CONFIGS[trigger?.event_type];

  useEffect(() => {
    const container = document.getElementById("workflow-editor-container");
    setContainer(container);
  }, []);

  if (!container) {
    return null;
  }

  return (
    <ResponsiveModal
      title={triggerText}
      isOpen={isOpen}
      setIsOpen={onClose}
      isSlider
      hideOverlay
      className="w-1/3 shadow-lg p-0 bg-card"
      bodyClassName="p-0 px-0"
      onPointerDownOutside={(e) => {
        e.preventDefault();
      }}
      container={container}
      //   footer={
      //     <div>
      //       <Button>Cancel</Button>
      //     </div>
      //   }
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

            await updateTrigger({
              id,
              tenant_id: trigger.tenant_id,
              event_type: event_type as string,
              metadata,
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
