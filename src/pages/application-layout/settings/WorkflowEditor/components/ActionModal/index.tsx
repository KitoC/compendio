import ResponsiveModal from "@/components/ui/responsive-modal";
import { useState, useEffect, useCallback } from "react";
import FormBuilder from "@/components/form-builder";
import { useCustomTables } from "@/contexts/CustomTables";
import {
  ACTION_FORM_CONFIGS,
  getActionText,
  DEFAULT_ACTION_TYPE_DATA,
  getInputOptionsForAction,
} from "../../consts/actions";
import { useWorkflowEditor } from "@/contexts/WorkflowEditorProvider";
import ActionModalContext from "./ActionModalContext";

const ActionModal = ({ isOpen, onClose, id }) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const { workflow, updateWorkflow } = useWorkflowEditor();

  const action = workflow?.actions.find((action) => action.id === id);

  const { tables } = useCustomTables();

  const actionText = getActionText(action, tables).plainText;

  const actionFormConfig = ACTION_FORM_CONFIGS[action?.action_type];

  useEffect(() => {
    const container = document.getElementById("workflow-editor-container");

    setContainer(container);
  }, []);

  const onSubmit = useCallback(
    async ({ event_type, ...metadata }) => {
      const nextValue = {
        ...action,
        metadata: {
          ...action.metadata,
          ...metadata,
        },
      };

      updateWorkflow({
        ...workflow,
        actions: workflow.actions.map((action) =>
          action.id === id ? nextValue : action
        ),
      });
    },
    [action, workflow, id, updateWorkflow]
  );

  const default_input_data = getInputOptionsForAction({
    workflow,
    action,
    tables,
  });

  return (
    <ResponsiveModal
      title={actionText}
      isOpen={isOpen}
      setIsOpen={onClose}
      isSlider
      hideOverlay
      className="sm:max-w-md md:max-w-2xl shadow-lg p-0 bg-card z-50"
      bodyClassName="p-0 px-0"
      onPointerDownOutside={(e) => e.preventDefault()}
      onCloseAutoFocus={(e) => e.preventDefault()}
      onInteractOutside={(e) => e.preventDefault()}
      container={container}
      modal={false}
    >
      <ActionModalContext.Provider value={{ action, workflow }}>
        {action?.metadata?.aiDescription && (
          <div className="p-4">
            <p className="text-sm text-muted-foreground">
              {action?.metadata?.aiDescription as string}
            </p>
          </div>
        )}
        <FormBuilder
          className="pt-0 rounded-none border-none shadow-none"
          contentClassName="px-0 py-0 !space-y-0 shadow-none"
          footerClassname="py-0 shadow-none"
          hideSubmitButton
          submitOnChange={true}
          config={{
            id: "action-configuration",
            sections:
              actionFormConfig
                ?.getSections({ tables, action, workflow })
                .map((section) => ({
                  ...section,
                  className:
                    "border-b py-6 px-4 !space-y-0  last:border-b-transparent",
                })) || [],
          }}
          onSubmit={onSubmit}
          initialValues={{
            action_type: action?.action_type,
            ...(DEFAULT_ACTION_TYPE_DATA[action?.action_type] || {}),
            input_data: [
              default_input_data[default_input_data.length - 1],
            ].filter((d) => d),
            ...((action?.metadata as object) || {}),
          }}
        />
      </ActionModalContext.Provider>
    </ResponsiveModal>
  );
};

export default ActionModal;
