import { CustomTableSchema } from "@/types/customTable";
import { UserPermissions } from "@/components/custom-tables/types";

export interface CustomTableViewProps {
  table: CustomTableSchema;
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
