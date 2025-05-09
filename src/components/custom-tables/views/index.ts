import GridView from "./GridView/GridView";
import CalendarView from "./CalendarView";
import GalleryView from "./GalleryView";
import KanbanView from "./KanbanView";
import TimelineView from "./TimelineView";
import { TimeScale } from "./types";
import { ViewType } from "@/services/DataViewsService";

export { GridView, CalendarView, GalleryView, KanbanView, TimelineView };
export type { ViewType, TimeScale };

export const getViewIcon = (viewType: ViewType): string => {
  switch (viewType) {
    case ViewType.Grid:
      return "Grid";
    case ViewType.Calendar:
      return "Calendar";
    case ViewType.Gallery:
      return "LayoutGrid";
    case ViewType.Kanban:
      return "Kanban";
    case ViewType.Timeline:
      return "GanttChart";
    default:
      return "Table";
  }
};
