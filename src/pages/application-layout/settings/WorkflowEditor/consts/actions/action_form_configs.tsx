import { ACTION_TYPES } from "./types";
import { FormSection, FormField } from "@/components/form-builder/types";
import { ConditionBuilder } from "../../components/ActionModal/ConditionBuilder";
import { CustomTable } from "@/contexts/CustomTables/CustomTablesContext";
import { WorkflowAction, Workflow } from "@/types/workflows";
import FieldMapper from "../../components/ActionModal/FieldMapper";
import { getTriggerText } from "../triggers";
import { getActionText } from "./action_text";

interface ActionFormConfig {
  getSections: (context: {
    tables: CustomTable[];
    action: WorkflowAction;
    workflow: Workflow;
  }) => FormSection[];
}

const getTableSelect = (tables: CustomTable[]): FormField => ({
  id: "table",
  name: "table",
  label: "Table",
  type: "select",
  validation: {
    required: true,
  },
  options: tables.map((table) => ({
    value: table.id,
    label: table.name,
  })),
  onChangeSideEffect: ({ name, value, formValues, setFormValues }) => {
    setFormValues({
      ...formValues,
      fields: [],
    });
  },
});

const getAirtableUpdateAndCreateActionForm = ({ tables, action, workflow }) => {
  const sections: FormSection[] = [
    {
      id: "record-action-form",
      fields: [
        getTableSelect(tables),
        {
          id: "use_ai",
          name: "use_ai",
          type: "switch",
          label: "Let AI decide",
          description: "Tell the AI determine how to fill in the fields.",
          defaultValue: false,
          disabled: false,
        },
      ],
    },
  ];

  if (action?.metadata?.table && !action.metadata.use_ai) {
    sections.push({
      id: "field-inputs",
      fields: [
        {
          id: "fields",
          name: "fields",
          type: "custom",
          label: "Fields",
          CustomComponent: FieldMapper,
        },
      ],
    });
  }

  if (action.metadata.use_ai) {
    sections.push({
      id: "ai-context",
      fields: [
        {
          id: "source_data",
          name: "source_data",
          type: "multiselect",
          label: "Source data from",
          options: [
            {
              value: `trigger_result`,
              label: "Trigger results (each trigger provides data separately)",
            },
            ...workflow.actions
              .filter(
                (wAction) =>
                  wAction.id !== action.id &&
                  ![ACTION_TYPES.CONDITIONAL].includes(wAction.action_type)
              )
              .map((workflowAction) => {
                return {
                  value: `action_result:${workflowAction.id}`,
                  label: `Action result: ${
                    getActionText(workflowAction, tables).plainText
                  }`,
                };
              }),
          ],
        },
        {
          id: "ai_prompt",
          name: "ai_prompt",
          type: "textarea",
          label: "Inform the AI how to handle the data.",
          description:
            "This will be used in conjunction with the source data to inform the AI how to handle the data.",
          defaultValue: "",
        },
      ],
    });
  }

  return sections;
};

export const ACTION_FORM_CONFIGS: Record<string, ActionFormConfig> = {
  [ACTION_TYPES.CONDITIONAL]: {
    getSections: ({ tables }) => [
      {
        id: "conditional-action-form",
        fields: [
          {
            id: "use_ai_prompt",
            name: "use_ai_prompt",
            type: "switch",
            label: "Let AI decide",
            description:
              "Tell the AI what you want to happen and it will decide if the condition is met.",
            defaultValue: true,
            disabled: false,
          },
          {
            id: "ai_prompt",
            name: "ai_prompt",
            type: "textarea",
            label: "Describe how you want this condition to work.",
            description:
              "This will be used to inform the AI how to evaluate the condition.",
            defaultValue: "",
            hidden: (values) => !values.use_ai_prompt as boolean,
          },

          {
            id: "conditions",
            name: "conditions",
            type: "conditional",
            label: "Conditions",
            CustomComponent: ConditionBuilder,
            defaultValue: [],
            hidden: (values) => values.use_ai_prompt as boolean,
          },
        ],
      },
    ],
  },
  [ACTION_TYPES.CREATE_RECORD]: {
    getSections: getAirtableUpdateAndCreateActionForm,
  },
  [ACTION_TYPES.UPDATE_RECORD]: {
    getSections: getAirtableUpdateAndCreateActionForm,
  },
};
