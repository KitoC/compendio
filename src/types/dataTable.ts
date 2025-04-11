
import { ReactNode } from "react";

export interface Column<T = any> {
  field: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  hidden?: boolean;
  align?: "left" | "center" | "right";
}
