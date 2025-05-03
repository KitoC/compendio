import { IDataView } from "@/services/DataViewsService";
import { CalendarIcon, Table } from "lucide-react";

export const DEFAULT_VIEW: IDataView = {
  id: "default",
  label: "List view",
  view_type: "grid",
  config: {},
  created_at: new Date().toISOString(),
  deleted_at: null,
  external_table_id: null,
  data_table_id: null,
  tenant_id: null,
};

export const DATA_VIEW_TYPES = [
  {
    id: "grid",
    label: "Grid",
    value: "grid",
  },
  {
    id: "calendar",
    label: "Calendar",
    value: "calendar",
  },
  {
    id: "kanban",
    label: "Kanban",
    value: "kanban",
  },
];
