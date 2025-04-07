
import { FormConfig } from "@/components/form-builder/types";
import { AirtableField, AirtableTable } from "@/types/airtable";

export interface AirtableRecord {
  id: string;
  fields: Record<string, any>;
  createdTime?: string;
}

export interface AirtableTableProps {
  table: AirtableTable;
  records: AirtableRecord[];
  idField?: string;
  permissions?: Partial<UserPermissions>;
  onRowClick?: (item: AirtableRecord) => void;
  onUpdate?: (item: AirtableRecord) => Promise<void>;
  onCreate?: (item: Partial<AirtableRecord>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  searchable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  getFormConfig?: (config: FormConfig, record: AirtableRecord | null) => FormConfig;
}

export interface UserPermissions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  export: boolean;
}

export type AirtableFieldType =
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
  | "foreignKey";

export interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AirtableRecord | null;
  table: AirtableTable;
  onSave: (record: AirtableRecord) => Promise<void>;
  idField: string;
  isCreating?: boolean;
  getFormConfig?: (config: FormConfig, record: AirtableRecord | null) => FormConfig;
}

export interface FieldFilterProps {
  field: AirtableField;
  value: any;
  onChange: (value: any) => void;
}
