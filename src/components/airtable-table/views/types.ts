
import { AirtableRecord } from "../types";
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
}

export type ViewType = "grid" | "calendar" | "gallery" | "kanban" | "timeline";

export type TimeScale = "day" | "week" | "fortnight" | "month" | "quarter" | "year";
