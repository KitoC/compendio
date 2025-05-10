import { CustomTableSchema } from "@/types/customTable";
import { UserPermissions } from "@/components/custom-tables/types";

export interface CustomTableViewProps {
  emptyMessage?: string;
  permissions: UserPermissions;
  dataViewId: string;
}

export type TimeScale =
  | "day"
  | "week"
  | "fortnight"
  | "month"
  | "quarter"
  | "year";
