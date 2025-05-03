import { AirtableTable } from "@/types/airtable";
import { UserPermissions } from "@/components/airtable-table/types";

export interface AirtableViewProps {
  table: AirtableTable;
  emptyMessage?: string;
  permissions: UserPermissions;
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
