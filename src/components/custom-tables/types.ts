import { FormConfig } from "@/components/FormBuilder/types";
import {
  CustomTableField,
  CustomTableRecord,
  CustomTableSchema,
} from "@/types/customTable";

export interface CustomTableProps {
  table: CustomTableSchema;
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
  record: CustomTableRecord | null;
  table: CustomTableSchema;
  onSave: (record: CustomTableRecord) => Promise<void>;
  idField: string;
  isCreating?: boolean;
  getFormConfig?: (
    config: FormConfig,
    record: CustomTableRecord | null
  ) => FormConfig;
}

export interface FieldFilterProps {
  field: CustomTableField;
  value: unknown;
  onChange: (value: unknown) => void;
}
