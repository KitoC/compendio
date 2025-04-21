import { ACTION_TYPES } from "./types";
import { FormSection } from "@/components/form-builder/types";
import { CustomTable } from "@/contexts/CustomTables/CustomTablesContext";
import { WorkflowAction, Workflow } from "@/types/workflows";
import { ConditionBuilder, Condition } from "../../components/ConditionBuilder";

interface ActionFormConfig {
  getSections: (context: {
    tables: CustomTable[];
    action: WorkflowAction;
    workflow: Workflow;
  }) => FormSection[];
}

export const ACTION_FORM_CONFIGS: Record<string, ActionFormConfig> = {
  [ACTION_TYPES.CONDITIONAL]: {
    getSections: ({ action, workflow }) => [
      {
        id: "conditional-action-form",
        fields: [
          {
            name: "use_ai_prompt",
            type: "switch",
            label: "Let AI decide",
            description:
              "Tell the AI what you want to happen and it will decide if the condition is met.",
            defaultValue: true,
            disabled: false,
          },
          {
            name: "ai_prompt",
            type: "textarea",
            label: "Describe how you want this condition to work.",
            description:
              "This will be used to inform the AI how to evaluate the condition.",
            defaultValue: "",
            hidden: ({ use_ai_prompt }) => {
              return !use_ai_prompt;
            },
          },
          {
            name: "conditions",
            type: "conditional",
            label: "Conditions",
            CustomComponent: (props) => (
              <ConditionBuilder
                {...props}
                value={props.value as Condition[]}
                context={{ action, workflow }}
              />
            ),
            defaultValue: [],
            hidden: ({ use_ai_prompt }) => {
              return use_ai_prompt;
            },
          },
        ],
      },
    ],
  },
  [ACTION_TYPES.CREATE_RECORD]: {
    getSections: ({ tables }) => [
      {
        id: "create-record-action-form",
        fields: [],
      },
    ],
  },
  [ACTION_TYPES.UPDATE_RECORD]: {
    getSections: ({ tables }) => [
      {
        id: "update-record-action-form",
        fields: [],
      },
    ],
  },
  [ACTION_TYPES.DELETE_RECORD]: {
    getSections: ({ tables }) => [
      {
        id: "delete-record-action-form",
        fields: [],
      },
    ],
  },
};
