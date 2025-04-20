import ResponsiveModal from "@/components/ui/responsive-modal";
import { useUpdateWorkflow, useWorkflowQuery } from "@/hooks/useWorkflowsQuery";
import { useState, useEffect } from "react";
import FormBuilder from "@/components/form-builder";
import { useCustomTables } from "@/contexts/CustomTables";
import {
  ACTION_DESCRIPTION,
  ACTION_FORM_CONFIGS,
  getActionText,
} from "../consts/actions";
import { useWorkflowEditor } from "@/contexts/WorkflowEditorProvider";
const ActionModal = ({ isOpen, onClose, id, workflowId }) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const { workflow, updateWorkflow } = useWorkflowEditor();

  const action = workflow?.actions.find((action) => action.id === id);

  const [isPersisting, setIsPersisting] = useState(false);

  const { tables } = useCustomTables();

  const actionText = getActionText(action, tables);

  const actionFormConfig = ACTION_FORM_CONFIGS[action?.action_type];
  const actionDescription = ACTION_DESCRIPTION[action?.action_type];

  useEffect(() => {
    const container = document.getElementById("workflow-editor-container");
    setContainer(container);
  }, []);

  if (!container) {
    return null;
  }

  return (
    <ResponsiveModal
      title={actionText}
      isOpen={isOpen}
      setIsOpen={onClose}
      isSlider
      hideOverlay
      className="sm:max-w-md md:max-w-xl  shadow-lg p-0 bg-card"
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
      {action && (
        <FormBuilder
          className="pt-0 rounded-none border-none shadow-none"
          contentClassName="px-0 py-0 !space-y-0 shadow-none"
          footerClassname="py-0 shadow-none"
          hideSubmitButton
          submitOnChange={true}
          config={{
            id: "trigger-configuration",
            sections: [
              ...(actionFormConfig?.getSections({ tables, action }) || []),
            ].map((section) => ({
              ...section,
              className:
                "border-b py-6 px-4 !space-y-0  last:border-b-transparent",
            })),
          }}
          isSubmitting={isPersisting}
          onSubmit={async ({ event_type, ...metadata }) => {
            // setIsPersisting(true);
            // await updateTrigger({
            //   id,
            //   tenant_id: trigger.tenant_id,
            //   event_type: event_type as string,
            //   metadata,
            // });
            // setIsPersisting(false);
          }}
          initialValues={{
            action_type: action?.action_type,
            ...(action.metadata as object),
          }}
        />
      )}
    </ResponsiveModal>
  );
};

export default ActionModal;
