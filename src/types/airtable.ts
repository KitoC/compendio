import type { Database } from "@/integrations/supabase/types";

export interface AirtableChoice {
  id: string;
  name: string;
  color?: string;
}

export interface AirtableFieldOption {
  choices?: AirtableChoice[];
  dateFormat?: { name: string; format: string };
  timeFormat?: { name: string; format: string };
  precision?: number;
  isReversed?: boolean;
  foreignTableId?: string;
  linkedTableId?: string;
  inverseLinkedTableId?: string;
  symbol?: string;
  max?: number;
  color?: string;
  icon?: string;
  result?: {
    type: string;
    options?: {
      precision?: number;
    };
  };
  [key: string]: unknown;
}

export type AirtableFieldType =
  | "aiText"
  | "autoNumber"
  | "multipleAttachments"
  | "checkbox"
  | "date"
  | "dateTime"
  | "email"
  | "currency"
  | "duration"
  | "formula"
  | "lastModifiedBy"
  | "lastModifiedTime"
  | "multipleRecordLinks"
  | "multilineText"
  | "multipleLookupValues"
  | "multipleCollaborators"
  | "multipleSelects"
  | "number"
  | "percent"
  | "phoneNumber"
  | "rating"
  | "richText"
  | "rollup"
  | "singleLineText"
  | "singleSelect"
  | "longText"
  | "lookup"
  | "singleCollaborator"
  | "createdTime"
  | "createdBy"
  | "button"
  | "count"
  | "barcode"
  | "foreignKey"
  | "externalSyncSource"
  | "url"
  | string;

export interface AirtableField {
  id: string;
  name: string;
  description?: string;
  // https://airtable.com/developers/web/api/field-model
  type: AirtableFieldType;
  options?: AirtableFieldOption;
  isComputed?: boolean;
  isPrimary?: boolean;
  isLocked?: boolean;
}

export interface AirtableView {
  id: string;
  name: string;
  description?: string;
}

export interface AirtableTable {
  id: string;
  name: string;
  primaryFieldId: string;
  fields: AirtableField[];
  description?: string;
  views: AirtableView[];
  external_id: string;
}

export interface AirtableBase {
  id: string;
  name: string;
  tables: AirtableTable[];
}

export interface AirtableBaseSchemaResponse {
  tables: AirtableTable[];
} // Returned from GET /meta/bases/:baseId/tables

export interface AirtableBaseListResponse {
  bases: AirtableBase[];
} // Returned from GET /meta/bases

export interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
  createdTime?: string;
  labels?: Record<string, DataTableRecordLabel[]>;
}

export type DataTableRecordLabel =
  Database["public"]["Tables"]["data_table_record_labels"]["Row"];
