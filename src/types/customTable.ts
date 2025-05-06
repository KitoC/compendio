import { AirtableFieldType } from "./airtable";
import { BaserowFieldType } from "./baserow";

export interface CustomTableRecord {
  _id: string;
  _created_at?: string;
  _updated_at?: string;
  [key: string]: unknown;
}

export interface SelectOption {
  value: string | number;
  label: string;
  color?: string;
}

export interface CustomTableField {
  id: string | number;
  name: string;
  description?: string;
  // https://airtable.com/developers/web/api/field-model
  type: AirtableFieldType | BaserowFieldType;
  sub_type?: string;
  // options?: AirtableFieldOption;
  options: SelectOption[];
  is_computed?: boolean;
  is_primary?: boolean;
  is_locked?: boolean;
  attr_key?: string;
  inverse_linked_table_id?: string | number;
  inverse_linked_field_id?: string | number;
  is_multiple?: boolean;
  original_provider_field: unknown;
  max_value?: number;
  color?: string;
  icon?: string;
  date_format?: string;
  time_format?: string;
  precision?: number;
  prefix?: string;
  suffix?: string;
  primary_key?: boolean;
}

export interface CustomTableFieldSchema {
  id: string;
  name: string;
  schema: CustomTableField;
  tenant_id: string;
  external_id: string;
  source: string;
  schema_id: string;
  schema_name: string;
  permissions: Record<string, string>;
}

export interface CustomTableSchema {
  id?: string;
  name: string;
  display_name: string;
  source: string;
  schema_id: string;
  tenant_id: string;
  permissions: Record<string, string>;
  schema_name: string;
  primary_field_id: string;
  fields: CustomTableField[];
  description?: string;
  external_id: string;
}

export interface CustomBaseSchema {
  id: string;
  name: string;
  tables: CustomTableSchema[];
}
