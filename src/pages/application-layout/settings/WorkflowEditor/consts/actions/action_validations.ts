import { every } from "lodash";
import { ACTION_TYPES } from "./types";

export const ACTION_VALIDATIONS = {
  [ACTION_TYPES.CREATE_RECORD]: () => false,
  [ACTION_TYPES.UPDATE_RECORD]: () => false,
  [ACTION_TYPES.DELETE_RECORD]: () => false,
  [ACTION_TYPES.CONDITIONAL]: (action) => {
    return every(
      action.metadata.conditions,
      (condition) =>
        condition?.leftValue?.value &&
        condition.operator &&
        condition?.rightValue?.value
    );
  },
};
