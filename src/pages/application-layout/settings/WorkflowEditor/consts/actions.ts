import { FormSection } from "@/components/form-builder/types";
import { CustomTable } from "@/contexts/CustomTables/CustomTablesContext";
import { FilePlus2, FileSymlink, FileX2, Split } from "lucide-react";
import { WorkflowAction } from "@/types/workflows";

export const ACTION_TYPES = {
  CREATE_RECORD: "create-record",
  UPDATE_RECORD: "update-record",
  DELETE_RECORD: "delete-record",
  CONDITIONAL: "conditional",
};

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
  [ACTION_TYPES.CONDITIONAL]: Split,
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

interface ActionFormConfig {
  getSections: (context: {
    tables: CustomTable[];
    action: WorkflowAction;
  }) => FormSection[];
}

export const ACTION_FORM_CONFIGS: Record<string, ActionFormConfig> = {
  [ACTION_TYPES.CONDITIONAL]: {
    getSections: ({ tables }) => [
      {
        id: "conditional-action-form",
        fields: [],
      },
    ],
  },
  [ACTION_TYPES.CREATE_RECORD]: {
    getSections: ({ tables }) => [
      {
        id: "create-record-action-form",
        fields: [],
      },
    ],
  },
  [ACTION_TYPES.UPDATE_RECORD]: {
    getSections: ({ tables }) => [
      {
        id: "update-record-action-form",
        fields: [],
      },
    ],
  },
  [ACTION_TYPES.DELETE_RECORD]: {
    getSections: ({ tables }) => [
      {
        id: "delete-record-action-form",
        fields: [],
      },
    ],
  },
};
