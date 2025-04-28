import { ACTION_TYPES } from "./types";

const DEFAULT_CREATE_OR_UPDATE_RECORD_DATA = {
  use_ai: true,
  ai_prompt: "",
  source_data: [],
  fields: [],
};

export const DEFAULT_ACTION_TYPE_DATA = {
  [ACTION_TYPES.CONDITIONAL]: {
    use_ai: true,
    ai_prompt: "",
    andOrValue: "and",
    conditions: [
      {
        leftValue: undefined,
        operator: undefined,
        rightValue: undefined,
      },
    ],
  },
  [ACTION_TYPES.CREATE_RECORD]: DEFAULT_CREATE_OR_UPDATE_RECORD_DATA,
  [ACTION_TYPES.UPDATE_RECORD]: DEFAULT_CREATE_OR_UPDATE_RECORD_DATA,
};
