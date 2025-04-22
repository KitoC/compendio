import { ACTION_TYPES } from "./types";
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

    if (table) {
      plainText += ` in ${table.name}`;
    }
  }

  return { plainText };
};
