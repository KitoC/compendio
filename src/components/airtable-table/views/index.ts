import GridView from "./GridView";
import CalendarView from "./CalendarView";
import GalleryView from "./GalleryView";
import KanbanView from "./KanbanView";
import TimelineView from "./TimelineView";
import { ViewType, TimeScale } from "./types";

export { GridView, CalendarView, GalleryView, KanbanView, TimelineView };
export type { ViewType, TimeScale };

export const getViewIcon = (viewType: ViewType): string => {
  switch (viewType) {
    case "grid":
      return "Grid";
    case "calendar":
      return "Calendar";
    case "gallery":
      return "LayoutGrid";
    case "kanban":
      return "Kanban";
    case "timeline":
      return "GanttChart";
    default:
      return "Table";
  }
};
