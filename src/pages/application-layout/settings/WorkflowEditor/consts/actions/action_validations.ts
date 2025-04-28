import { every } from "lodash";
import { ACTION_TYPES } from "./types";

const createAndUpdateRecordValidation = (action) => {
  const { metadata } = action;

  if (metadata.use_ai) {
    return !!metadata.source_data.length;
  }

  if (!metadata.use_ai) {
    return !!every(
      metadata.fields,
      (field) => field.value || field.type === "ai"
    );
  }

  return false;
};

export const ACTION_VALIDATIONS = {
  [ACTION_TYPES.CREATE_RECORD]: createAndUpdateRecordValidation,
  [ACTION_TYPES.UPDATE_RECORD]: createAndUpdateRecordValidation,
  [ACTION_TYPES.CONDITIONAL]: (action) => {
    if (action.metadata.use_ai) {
      return !!action.metadata.ai_prompt;
    }

    return every(
      action.metadata.conditions,
      (condition) =>
        condition?.leftValue?.value &&
        condition.operator &&
        condition?.rightValue?.value
    );
  },
};
