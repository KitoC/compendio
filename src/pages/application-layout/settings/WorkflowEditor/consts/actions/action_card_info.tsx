import { Sparkles, LetterText, Workflow } from "lucide-react";
import { ACTION_TYPES } from "./types";
import pluralize from "pluralize";

export const FIELD_TYPE_ICONS = {
  fixed: LetterText,
  expression: Workflow,
  ai: Sparkles,
};
const FIELD_LIMIT = 3;

const getCreateOrUpdateRecordCardInfo = (action) => {
  if (action.metadata.use_ai) {
    return (
      <>
        {action.metadata.ai_prompt && (
          <p
            className="text-xs text-muted-foreground truncate mb-2"
            title={action.metadata.ai_prompt}
          >
            {action.metadata.ai_prompt}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          (AI will generate data from {action.metadata?.input_data?.length}{" "}
          {pluralize("source", action.metadata?.input_data?.length)})
        </p>
      </>
    );
  }

  const firstFiveFields = action.metadata?.fields?.slice(0, FIELD_LIMIT);
  const remainingFields = action.metadata?.fields?.slice(FIELD_LIMIT);

  return (
    <>
      {firstFiveFields &&
        firstFiveFields.map((field) => {
          let value = field.value?.valueLabel || field.value;

          if (!value && field.type === "ai") {
            value = "AI generated";
          }

          const Icon = FIELD_TYPE_ICONS[field.type || "fixed"];

          return (
            <p
              key={field.id}
              className="text-xs text-muted-foreground flex items-center gap-1 "
            >
              <Icon className="w-3 h-3" />
              <span className="truncate">
                {field.name} - {value}
              </span>
            </p>
          );
        })}
      {remainingFields && remainingFields.length > 0 && (
        <p className="text-xs text-muted-foreground">
          + {remainingFields.length} more{" "}
          {pluralize("field", remainingFields.length)}
        </p>
      )}
    </>
  );
};

export const ACTION_CARD_INFO = {
  [ACTION_TYPES.CREATE_RECORD]: getCreateOrUpdateRecordCardInfo,
  [ACTION_TYPES.UPDATE_RECORD]: getCreateOrUpdateRecordCardInfo,
  [ACTION_TYPES.CONDITIONAL]: (action) => {
    if (action.metadata?.use_ai) {
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
