import { ACTION_TYPES } from "./types";
import { FormSection } from "@/components/form-builder/types";
import { ConditionBuilder } from "../../components/ActionModal/ConditionBuilder";

interface ActionFormConfig {
  sections: FormSection[];
}

export const ACTION_FORM_CONFIGS: Record<string, ActionFormConfig> = {
  [ACTION_TYPES.CONDITIONAL]: {
    sections: [
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
            hidden: (values) => !values.use_ai_prompt,
          },

          {
            id: "conditions",
            name: "conditions",
            type: "conditional",
            label: "Conditions",
            CustomComponent: ConditionBuilder,
            defaultValue: [],
            hidden: (values) => values.use_ai_prompt,
          },
        ],
      },
    ],
  },
  [ACTION_TYPES.CREATE_RECORD]: {
    sections: [
      {
        id: "create-record-action-form",
        fields: [],
      },
    ],
  },
  [ACTION_TYPES.UPDATE_RECORD]: {
    sections: [
      {
        id: "update-record-action-form",
        fields: [],
      },
    ],
  },
  [ACTION_TYPES.DELETE_RECORD]: {
    sections: [
      {
        id: "delete-record-action-form",
        fields: [],
      },
    ],
  },
};
