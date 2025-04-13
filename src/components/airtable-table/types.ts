import { FormConfig } from "@/components/form-builder/types";
import { AirtableField, AirtableTable, AirtableRecord } from "@/types/airtable";

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
  getFormConfig?: (
    config: FormConfig,
    record: AirtableRecord | null
  ) => FormConfig;
  onRefresh?: () => void;
  isRefreshing?: boolean;
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
