export interface SelectOption {
  value: string;
  label: string;
  color?: string;
}

export type FieldType =
  | "boolean"
  | "date"
  | "date_time"
  | "multiple_select"
  | "single_select"
  | "text"
  | "multiple_lookup"
  | "duration"
  | "url"
  | "file"
  | "email"
  | "rating"
  | "currency"
  | "percent"
  | "phone"
  | "link_row"
  | "rollup";

export type FieldRenderOptions = {
  type: FieldType;
  options?: SelectOption[];
  prefix?: string;
  suffix?: string;
};
