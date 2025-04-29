
import { ACTION_TYPES } from "./types";
import {
  WorkflowConditionalMetadata,
  WorkflowCreateOrUpdateRecordMetadata,
  WorkflowCondition
} from "@/types/workflows";

const DEFAULT_CREATE_OR_UPDATE_RECORD_DATA: WorkflowCreateOrUpdateRecordMetadata = {
  use_ai: true,
  ai_prompt: "",
  input_data: [],
  fields: [],
};

const DEFAULT_CONDITIONAL_DATA: WorkflowConditionalMetadata = {
  use_ai: true,
  ai_prompt: "",
  andOrValue: "and",
  conditions: [
    {
      leftValue: undefined,
      operator: undefined,
      rightValue: undefined,
    } as WorkflowCondition,
  ],
};

export const DEFAULT_ACTION_TYPE_DATA = {
  [ACTION_TYPES.CONDITIONAL]: DEFAULT_CONDITIONAL_DATA,
  [ACTION_TYPES.CREATE_RECORD]: DEFAULT_CREATE_OR_UPDATE_RECORD_DATA,
  [ACTION_TYPES.UPDATE_RECORD]: DEFAULT_CREATE_OR_UPDATE_RECORD_DATA,
};
