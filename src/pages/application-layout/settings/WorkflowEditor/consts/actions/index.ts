export * from "./types";
export * from "./default_data";
export * from "./action_form_configs";
export * from "./action_validations";
export * from "./action_card_info";

import { CheckSquare, FilePlus2, FileSymlink, FileX2 } from "lucide-react";

import { ACTION_TYPES } from "./types";

export const ACTION_TEXT = {
  [ACTION_TYPES.CREATE_RECORD]: "Create Record",
  [ACTION_TYPES.UPDATE_RECORD]: "Update Record",
  [ACTION_TYPES.DELETE_RECORD]: "Delete Record",
  [ACTION_TYPES.CONDITIONAL]: "Conditional logic",
};

export const ACTION_DESCRIPTION = {
  [ACTION_TYPES.CREATE_RECORD]:
    "This action will create a new record in the selected table.",
  [ACTION_TYPES.UPDATE_RECORD]:
    "This action will update a record in the selected table.",
  [ACTION_TYPES.DELETE_RECORD]:
    "This action will delete a record in the selected table.",
  [ACTION_TYPES.CONDITIONAL]:
    "Allows you to create conditional logic for your workflow.",
};

export const getActionText = (action, tables) => {
  if (!action) {
    return "";
  }

  let baseText = ACTION_TEXT[action.action_type];

  if (action.metadata.table && tables) {
    const table = tables.find((table) => table.id === action.metadata.table);

    if (table) {
      baseText += ` in ${table.name}`;
    }
  }

  return baseText;
};

export const ACTION_ICONS = {
  [ACTION_TYPES.CREATE_RECORD]: FilePlus2,
  [ACTION_TYPES.UPDATE_RECORD]: FileSymlink,
  [ACTION_TYPES.DELETE_RECORD]: FileX2,
  [ACTION_TYPES.CONDITIONAL]: CheckSquare,
};

const DATA_ACTIONS = [
  ACTION_TYPES.CREATE_RECORD,
  ACTION_TYPES.UPDATE_RECORD,
  ACTION_TYPES.DELETE_RECORD,
];

const LOGICAL_ACTIONS = [ACTION_TYPES.CONDITIONAL];

export const ACTION_OPTIONS = [
  { group: "Logical operators", types: LOGICAL_ACTIONS },
  { group: "Data actions", types: DATA_ACTIONS },
].map(({ group, types }) => ({
  group,
  options: types.map((type) => ({
    value: type,
    label: ACTION_TEXT[type],
    Icon: ACTION_ICONS[type],
  })),
}));
