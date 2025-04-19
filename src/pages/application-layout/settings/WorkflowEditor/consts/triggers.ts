import { FilePlus2, FileSymlink, FileX2, Mail, Webhook } from "lucide-react";
import { WorkflowTrigger } from "@/services/WorkflowService";
import { FormSection } from "@/components/form-builder/types";
import {
  CustomTable,
  CustomTableField,
} from "@/contexts/CustomTables/CustomTablesContext";

export const TRIGGER_TYPES = {
  RECORD_CREATED: "record-created",
  RECORD_UPDATED: "record-updated",
  RECORD_DELETED: "record-deleted",
  WEBHOOK_RECEIVED: "webhook-received",
  EMAIL_RECEIVED: "email-received",
};

export const TRIGGER_TEXT = {
  [TRIGGER_TYPES.RECORD_CREATED]: "When record is created",
  [TRIGGER_TYPES.RECORD_UPDATED]: "When record is updated",
  [TRIGGER_TYPES.RECORD_DELETED]: "When record is deleted",
  [TRIGGER_TYPES.WEBHOOK_RECEIVED]: "When webhook received",
  [TRIGGER_TYPES.EMAIL_RECEIVED]: "When email received",
};

export const TRIGGER_DESCRIPTION = {
  [TRIGGER_TYPES.RECORD_CREATED]:
    "This trigger will fire when a record is created in the selected table.",
  [TRIGGER_TYPES.RECORD_UPDATED]:
    "This trigger will fire when a record is updated in the selected table.",
  [TRIGGER_TYPES.RECORD_DELETED]:
    "This trigger will fire when a record is deleted in the selected table.",
  [TRIGGER_TYPES.WEBHOOK_RECEIVED]:
    "This trigger will fire when a webhook is received.",
  [TRIGGER_TYPES.EMAIL_RECEIVED]:
    "This trigger will fire when an email is received.",
};

export const getTriggerText = (trigger, tables) => {
  if (!trigger) {
    return "";
  }

  let baseText = TRIGGER_TEXT[trigger.event_type];

  if (trigger.metadata.table && tables) {
    const table = tables.find((table) => table.id === trigger.metadata.table);

    if (table) {
      baseText += ` in ${table.name}`;
    }
  }

  return baseText;
};

export const TRIGGER_ICONS = {
  [TRIGGER_TYPES.RECORD_CREATED]: FilePlus2,
  [TRIGGER_TYPES.RECORD_UPDATED]: FileSymlink,
  [TRIGGER_TYPES.RECORD_DELETED]: FileX2,
  [TRIGGER_TYPES.WEBHOOK_RECEIVED]: Webhook,
  [TRIGGER_TYPES.EMAIL_RECEIVED]: Mail,
};

export const TRIGGER_OPTIONS = Object.values(TRIGGER_TYPES).map((type) => ({
  value: type,
  label: TRIGGER_TEXT[type],
  Icon: TRIGGER_ICONS[type],
}));

const getTableSelect = (tables: CustomTable[]) => ({
  id: "table",
  name: "table",
  label: "Table",
  type: "select",
  required: true,
  options: tables.map((table) => ({
    value: table.id,
    label: table.name,
  })),
});

const getFieldSelect = (table: CustomTable, fields: CustomTableField[]) => ({
  id: "fields",
  name: "fields",
  label: "Fields to watch",
  type: "multiselect",
  required: true,
  disabled: !table,
  options: fields.map((field) => ({
    value: field.id,
    label: (field.schema as Record<string, unknown>).name,
  })),
});

interface TriggerFormConfig {
  getSections: (context: {
    tables: CustomTable[];
    trigger: WorkflowTrigger;
  }) => FormSection[];
}

export const TIGGER_FORM_CONFIGS: Record<string, TriggerFormConfig> = {
  [TRIGGER_TYPES.RECORD_CREATED]: {
    getSections: ({ tables }) => [
      {
        id: "record-created-trigger-form",
        fields: [getTableSelect(tables)],
      },
    ],
  },
  [TRIGGER_TYPES.RECORD_UPDATED]: {
    getSections: ({ tables, trigger }) => {
      const selectedTable = tables.find(
        (table) =>
          table.id === (trigger?.metadata as Record<string, unknown>).table
      );

      return [
        {
          id: "record-updated-trigger-form",
          fields: [
            getTableSelect(tables),
            getFieldSelect(selectedTable, selectedTable?.fields || []),
          ],
        },
      ];
    },
  },
  [TRIGGER_TYPES.RECORD_DELETED]: {
    getSections: ({ tables }) => [
      {
        id: "record-deleted-trigger-form",
        fields: [getTableSelect(tables)],
      },
    ],
  },
  [TRIGGER_TYPES.WEBHOOK_RECEIVED]: {
    getSections: ({ tables }) => [
      {
        id: "webhook-received-trigger-form",
        fields: [
          {
            id: "webhook-url",
            name: "webhook-url",
            label: "Webhook URL",
            type: "text",
            required: true,
          },
        ],
      },
    ],
  },
  [TRIGGER_TYPES.EMAIL_RECEIVED]: {
    getSections: ({ tables }) => [],
  },
};
