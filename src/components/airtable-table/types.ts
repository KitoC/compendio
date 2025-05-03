import { FormConfig } from "@/components/form-builder/types";
import { AirtableField, AirtableTable, AirtableRecord } from "@/types/airtable";

export interface AirtableTableProps {
  table: AirtableTable;
  permissions: UserPermissions;
  emptyMessage?: string;
  className?: string;
}

export interface UserPermissions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  export: boolean;
}

export interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AirtableRecord | null;
  table: AirtableTable;
  onSave: (record: AirtableRecord) => Promise<void>;
  idField: string;
  isCreating?: boolean;
  getFormConfig?: (
    config: FormConfig,
    record: AirtableRecord | null
  ) => FormConfig;
}

export interface FieldFilterProps {
  field: AirtableField;
  value: unknown;
  onChange: (value: unknown) => void;
}
