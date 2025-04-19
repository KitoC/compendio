import { FilePlus2, FileSymlink, FileX2, Mail, Webhook } from "lucide-react";

export const ACTION_TYPES = {
  CREATE_RECORD: "create-record",
  UPDATE_RECORD: "update-record",
  DELETE_RECORD: "delete-record",
};

export const ACTION_TEXT = {
  [ACTION_TYPES.CREATE_RECORD]: "Create Record",
  [ACTION_TYPES.UPDATE_RECORD]: "Update Record",
  [ACTION_TYPES.DELETE_RECORD]: "Delete Record",
};

export const ACTION_DESCRIPTION = {
  [ACTION_TYPES.CREATE_RECORD]:
    "This action will create a new record in the selected table.",
  [ACTION_TYPES.UPDATE_RECORD]:
    "This action will update a record in the selected table.",
  [ACTION_TYPES.DELETE_RECORD]:
    "This action will delete a record in the selected table.",
};

export const getActionText = (action, tables) => {
  if (!action) {
    return "";
  }

  let baseText = ACTION_TEXT[action.event_type];

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
};

export const ACTION_OPTIONS = Object.values(ACTION_TYPES).map((type) => ({
  value: type,
  label: ACTION_TEXT[type],
  Icon: ACTION_ICONS[type],
}));
