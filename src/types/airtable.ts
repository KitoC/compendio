export interface AirtableChoice {
  id: string;
  name: string;
  color?: string;
}

export interface AirtableFieldOption {
  choices?: AirtableChoice[];
  dateFormat?: { name: string; format: string };
  timeFormat?: { name: string; format: string };
  precision?: string;
  isReversed?: boolean;
  foreignTableId?: string;
  [key: string]: unknown;
}

export interface AirtableField {
  id: string;
  name: string;
  description?: string;
  type:
    | "singleLineText"
    | "longText"
    | "attachment"
    | "checkbox"
    | "multipleSelects"
    | "singleSelect"
    | "date"
    | "dateTime"
    | "email"
    | "url"
    | "number"
    | "percent"
    | "currency"
    | "duration"
    | "rating"
    | "phoneNumber"
    | "formula"
    | "rollup"
    | "lookup"
    | "createdTime"
    | "lastModifiedTime"
    | "createdBy"
    | "lastModifiedBy"
    | "button"
    | "count"
    | "autoNumber"
    | "barcode"
    | "foreignKey"
    | string;
  options?: AirtableFieldOption;
  isComputed?: boolean;
  isPrimary?: boolean;
  isLocked?: boolean;
}

export interface AirtableTable {
  id: string;
  name: string;
  primaryFieldId: string;
  fields: AirtableField[];
  description?: string;
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
  fields: Record<string, any>;
  createdTime?: string;
}
