import { ACTION_TYPES } from "./types";

export const ACTION_CARD_INFO = {
  [ACTION_TYPES.CREATE_RECORD]: () => null,
  [ACTION_TYPES.UPDATE_RECORD]: () => null,
  [ACTION_TYPES.DELETE_RECORD]: () => null,
  [ACTION_TYPES.CONDITIONAL]: (action) => {
    if (action.metadata?.use_ai_prompt) {
      return (
        <p className="text-xs text-muted-foreground">
          {action.metadata?.ai_prompt}
        </p>
      );
    }

    return (
      action.metadata?.conditions &&
      action.metadata?.conditions.map((condition, index) => (
        <p
          key={condition.id}
          className="text-xs text-muted-foreground"
          title={condition.value}
        >
          {index !== 0 && (
            <span className="mr-1 font-bold">
              {action.metadata?.andOrValue}
            </span>
          )}
          <span className="mr-1">If</span>{" "}
          <span className="font-bold mr-1">
            {condition.leftValue?.label || "..."}{" "}
          </span>
          <span className=" mr-1">{condition.operator?.label}</span>
          <span className="font-bold mr-1">
            {condition.rightValue?.label ||
              condition.rightValue?.value ||
              "..."}
          </span>
        </p>
      ))
    );
  },
};
