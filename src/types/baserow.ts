export interface BaserowTable {
  id: string;
  name: string;
  fields: BaserowField[];
}

export interface BaserowSelectOption {
  id: number;
  value: string;
  color?: string;
}

export interface BaserowCollaborator {
  id: number;
  name: string;
}

export interface BaserowField {
  id: number;
  table_id: number;
  order: number;
  name: string;
  type: BaserowFieldType;
  primary?: boolean;
  read_only?: boolean;
  immutable_type?: boolean;
  immutable_properties?: boolean;
  description?: string;
  database_id?: number;
  workspace_id?: number;
  nullable?: boolean;
  error?: string;
  array_formula_type?: string;
  select_options?: BaserowSelectOption[];
  number_decimal_places?: number;
  number_suffix?: string;
  available_collaborators?: BaserowCollaborator[];
  date_format?: string;
  date_force_timezone?: string;
  date_time_format?: string;
  date_include_time?: boolean;
  date_show_tzinfo?: boolean;
  duration_format?: string;
  number_prefix?: string;
  number_separator?: string;
  formula?: string;
  formula_type?: string;
  through_field_id?: number;
  through_field_name?: string;
  target_field_id?: number;
  target_field_name?: string;
  rollup_function?: string;
  number_default?: number;
  boolean_default?: boolean;
  text_default?: string;
  long_text_enable_rich_text?: boolean;
  link_row_table_id?: number;
  link_row_related_field_id?: number;
  link_row_table?: number;
  link_row_related_field?: number;
  link_row_limit_selection_view_id?: number;
  link_row_table_primary_field?: BaserowField;
  link_row_multiple_relationships?: boolean;
  notify_user_when_added?: boolean;
  file_max_size?: number;
  file_allowed_extensions?: string[];
  file_allowed_mime_types?: string[];
  file_default?: string;
  file_max_size_unit?: string;
  file_max_size_unit_type?: string;
  file_max_size_unit_type_short?: string;
  file_max_size_unit_type_long?: string;
  file_max_size_unit_type_short_long?: string;
  max_value?: number;
  min_value?: number;
  number_negative?: boolean;
  number_min?: number;
  number_max?: number;
  color?: string;
  style?: string;
}

export interface BaserowBase {
  id: string;
  name: string;
  tables: BaserowTable[];
}

export type BaserowFieldType =
  | "text"
  | "long_text"
  | "boolean"
  | "link_row"
  | "number"
  | "rating"
  | "date"
  | "last_modified"
  | "created_on"
  | "duration"
  | "url"
  | "email"
  | "phone_number"
  | "formula"
  | "count"
  | "rollup"
  | "lookup"
  | "uuid"
  | "multiple_collaborators"
  | "autonumber"
  | "password"
  | "file"
  | "single_select"
  | "multiple_select"
  | "password";
