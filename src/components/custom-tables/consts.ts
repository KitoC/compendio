import { IDataView, ViewType } from "@/services/DataViewsService";

export const DEFAULT_VIEW: IDataView = {
  id: "default",
  label: "List view",
  view_type: ViewType.Grid,
  config: {},
  created_at: new Date().toISOString(),
  deleted_at: null,
  external_table_id: null,
  data_table_id: null,
  tenant_id: null,
  data_navigation_item_id: null,
  is_default: true,
  alias: null,
};

export const DATA_VIEW_TYPES = [
  {
    id: ViewType.Grid,
    label: "Grid",
    value: ViewType.Grid,
  },
  {
    id: ViewType.Calendar,
    label: "Calendar",
    value: ViewType.Calendar,
  },
  {
    id: ViewType.Kanban,
    label: "Kanban",
    value: ViewType.Kanban,
  },
];
