
import { AirtableRecord, AirtableTableSchema } from "../types";

export interface AirtableViewProps {
  records: AirtableRecord[];
  table: AirtableTableSchema;
  isLoading: boolean;
  onRowClick: (record: AirtableRecord) => void;
  emptyMessage?: string;
  sortField?: string | null;
  sortDirection?: "asc" | "desc";
  handleSort?: (fieldName: string) => void;
}

export type ViewType = "grid" | "calendar" | "gallery" | "kanban" | "timeline";
