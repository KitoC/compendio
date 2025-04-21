import { ACTION_TYPES } from "./types";

export const DEFAULT_ACTION_TYPE_DATA = {
  [ACTION_TYPES.CONDITIONAL]: {
    use_ai_prompt: false,
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
};
