import { ACTION_TYPES } from "./types";
import pluralize from "pluralize";

export const ACTION_TEXT = {
  [ACTION_TYPES.CREATE_RECORD]: "Create Record",
  [ACTION_TYPES.UPDATE_RECORD]: "Update Record",
  [ACTION_TYPES.CONDITIONAL]: "Conditional logic",
};

export const getActionText = (action, tables): { plainText: string } => {
  if (!action) {
    return { plainText: "" };
  }

  let plainText = ACTION_TEXT[action.action_type];

  if (action.metadata.table && tables) {
    const table = tables.find((table) => table.id === action.metadata.table);

    if (plainText === "Create Record") {
      plainText = plainText.replace(
        "Record",
        `new ${pluralize.singular(table.name)}`
      );
    }
    if (plainText === "Update Record") {
      plainText = plainText.replace(
        "Record",
        `${pluralize.singular(table.name)}`
      );
    }
  }

  return { plainText };
};
