import { AirtableRecord, UserPermissions } from "@/types/airtable";
import { AirtableTable } from "@/types/airtable";

export interface AirtableViewProps {
  records: AirtableRecord[];
  table: AirtableTable;
  isLoading: boolean;
  onRowClick: (record: AirtableRecord) => void;
  onUpdate?: (record: AirtableRecord) => Promise<void>;
  emptyMessage?: string;
  sortField?: string | null;
  sortDirection?: "asc" | "desc";
  handleSort?: (fieldName: string) => void;
  permissions: UserPermissions;
  paginatedRecords: AirtableRecord[];
  handleEdit: (record: AirtableRecord) => void;
  handleCreate: () => void;
  handleDeleteConfirm: () => void;
  handleFilterChange: (fieldName: string, value: unknown) => void;
  handleExport: () => void;
  handleRefresh: () => void;
  setDeleteRecordId: (recordId: string) => void;
  dataViewId: string;
}

export type ViewType = "grid" | "calendar" | "gallery" | "kanban" | "timeline";

export type TimeScale =
  | "day"
  | "week"
  | "fortnight"
  | "month"
  | "quarter"
  | "year";
