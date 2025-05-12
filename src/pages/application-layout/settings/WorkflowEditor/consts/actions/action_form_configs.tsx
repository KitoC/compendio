import { ACTION_TYPES } from "./types";
import { FormSection, FormField } from "@/components/FormBuilder/types";
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

export const getInputOptionsForAction = ({ workflow, action, tables }) => {
  const currentActionIndex = workflow.actions
    .sort((a, b) => a.position - b.position)
    .findIndex((a) => a.id === action.id);

  const previousActions = workflow.actions.slice(0, currentActionIndex);

  const options = [
    {
      value: "TRIGGER",
      label: `Trigger result: ${
        getTriggerText(workflow.triggers[0], tables).plainText
      }`,
    },
    ...previousActions.map((workflowAction) => {
      return {
        value: `${workflowAction.id}`,
        label: `Action result: ${
          getActionText(workflowAction, tables).plainText
        }`,
      };
    }),
  ];

  return options.map((option, index) => ({
    ...option,
    label:
      index === options.length - 1
        ? `[previous step] ${option.label}`
        : option.label,
  }));
};

const getInputDataField = ({ workflow, action, tables }): FormField => {
  const options = getInputOptionsForAction({ workflow, action, tables });
  return {
    id: "input_data",
    name: "input_data",
    type: "multiselect",
    label: "Input data from",
    disabled: options.length === 1,
    options,
  };
};

const getAirtableUpdateAndCreateActionForm = ({ tables, action, workflow }) => {
  const sections: FormSection[] = [
    {
      id: "record-action-form",
      fields: [
        getTableSelect(tables),
        // {
        //   id: "use_ai",
        //   name: "use_ai",
        //   type: "switch",
        //   label: "Let AI decide",
        //   description: "Tell the AI determine how to fill in the fields.",
        //   defaultValue: false,
        //   disabled: false,
        // },
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
        getInputDataField({ action, tables, workflow }),
        {
          id: "ai_prompt",
          name: "ai_prompt",
          type: "textarea",
          label: "Tell the AI how to handle the data from the source.",
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
    getSections: ({ action, tables, workflow }) => [
      {
        id: "conditional-action-form",
        fields: [
          // {
          //   id: "use_ai",
          //   name: "use_ai",
          //   type: "switch",
          //   label: "Let AI decide",
          //   description:
          //     "Tell the AI what you want to happen and it will decide if the condition is met.",
          //   defaultValue: true,
          //   disabled: false,
          // },
          getInputDataField({ action, tables, workflow }),

          {
            id: "ai_prompt",
            name: "ai_prompt",
            type: "textarea",
            label:
              "Describe how you want this condition to work and AI will handle it for you.",
            description:
              "This will be used to inform the AI how to evaluate the condition.",
            defaultValue: "",
            hidden: (values) => !values.use_ai as boolean,
          },
          {
            id: "conditions",
            name: "conditions",
            type: "conditional",
            label: "Conditions",
            CustomComponent: ConditionBuilder,
            defaultValue: [],
            hidden: (values) => values.use_ai as boolean,
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
