// NO_CHANGE

export type Permission = "create" | "read" | "update" | "delete" | "export";

export interface UserPermissions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  export: boolean;
}

export interface Column<T = unknown> {
  field: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  hidden?: boolean;
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  idField?: keyof T;
  columns?: Column<T>[];
  permissions?: Partial<UserPermissions>;
  title?: string;
  subtitle?: string;
  searchable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  onRowClick?: (item: T) => void;
  onUpdate?: (item: T) => Promise<void>;
  onCreate?: (item: Partial<T>) => Promise<void>;
  onDelete?: (id: string | number) => Promise<void>;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export interface TableHeaderProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  permissions: UserPermissions;
  sortField?: keyof T | null;
  sortDirection?: "asc" | "desc";
  onSort?: (field: keyof T) => void;
  showActionsColumn: boolean;
}

export interface TableBodyProps<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  idField: keyof T;
  permissions: UserPermissions;
  onEdit?: (item: T) => void;
  onDelete?: (id: string | number) => void;
  onRowClick?: (item: T) => void;
  isEditing?: string | number | null;
}

export interface TableActionsProps<T extends Record<string, unknown>> {
  item: T;
  idField: keyof T;
  permissions: UserPermissions;
  onEdit?: (item: T) => void;
  onDelete?: (id: string | number) => void;
}

export interface PaginationProps {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export interface TableFilterProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  filters: Record<string, string>;
  onFilterChange: (field: string, value: string) => void;
}

export interface EditModalProps<T extends Record<string, unknown>> {
  isOpen: boolean;
  onClose: () => void;
  item?: T | null;
  onSave: (item: T) => Promise<void>;
  columns: Column<T>[];
  idField: keyof T;
  isCreating?: boolean;
}
