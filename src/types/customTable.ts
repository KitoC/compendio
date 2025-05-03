import { AirtableFieldOption, AirtableFieldType } from "./airtable";

export interface CustomTableRecord {
  _id: string;
  _createdTime?: string;
  [key: string]: unknown;
}

export interface SelectOption {
  id: string;
  name: string;
  color: string;
}

export interface CustomTableField {
  id: string;
  name: string;
  description?: string;
  // https://airtable.com/developers/web/api/field-model
  type: AirtableFieldType;
  options?: AirtableFieldOption;
  select_options: SelectOption[];
  isComputed?: boolean;
  isPrimary?: boolean;
  isLocked?: boolean;
}

export interface CustomTableSchema {
  id: string;
  name: string;
  primaryFieldId: string;
  fields: CustomTableField[];
  description?: string;
  external_id: string;
}
