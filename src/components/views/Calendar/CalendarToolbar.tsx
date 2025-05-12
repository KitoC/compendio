import { Button } from "@/components/ui/button";
import { CalendarToolbarProps } from "./types";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format } from "date-fns";

export function CalendarToolbar({
  onNavigate,
  onView,
  date,
  view,
}: CalendarToolbarProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate("PREV")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate("NEXT")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={() => onNavigate("TODAY")}>
          Today
        </Button>
        <div className="ml-4 text-lg font-semibold">
          {format(date, "MMMM yyyy")}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={view === "month" ? "default" : "outline"}
          onClick={() => onView("month")}
        >
          Month
        </Button>
        <Button
          variant={view === "week" ? "default" : "outline"}
          onClick={() => onView("week")}
        >
          Week
        </Button>
        <Button
          variant={view === "day" ? "default" : "outline"}
          onClick={() => onView("day")}
        >
          Day
        </Button>
        <Button
          variant={view === "agenda" ? "default" : "outline"}
          onClick={() => onView("agenda")}
        >
          Agenda
        </Button>
      </div>
    </div>
  );
}

export default CalendarToolbar;
