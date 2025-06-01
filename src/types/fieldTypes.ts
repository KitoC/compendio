export interface SelectOption<T> {
  value: string;
  label: string;
  color?: string;
  data?: T;
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
  options?: SelectOption<unknown>[];
  prefix?: string;
  suffix?: string;
  isMulti?: boolean;
  dateFormat?: string;
  dateIncludeTime?: boolean;
};
