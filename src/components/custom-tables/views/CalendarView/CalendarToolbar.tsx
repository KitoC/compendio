import { Button } from "@/components/ui/button";
import { Navigate, Views } from "react-big-calendar";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight, Settings, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DataViewModal from "@/components/DataViewModal";
import { useState } from "react";
import { useDataViewContext } from "@/contexts/DataViewProvider/DataViewContext";

const getDateLabel = (view, date) => {
  const format = "MMM D";
  const currentYear = dayjs().format("YYYY");

  const yearDate =
    dayjs(date).format("YYYY") === currentYear
      ? ""
      : dayjs(date).format("YYYY");
  let startDate, endDate;

  switch (view) {
    case Views.MONTH:
      return `${dayjs(date).format("MMMM")} ${yearDate}`;
    case Views.WEEK:
      startDate = dayjs(date).startOf("week").format(format);
      endDate = dayjs(date).endOf("week").format(format);

      return `${startDate} - ${endDate} ${yearDate}`;
    case Views.WORK_WEEK:
      startDate = dayjs(date).day(1).format(format);
      endDate = dayjs(date).day(5).format(format);

      return `${startDate} - ${endDate} ${yearDate}`;
    case Views.DAY:
      return dayjs(date).format("dddd, MMM D, YYYY");
    case Views.AGENDA:
      startDate = dayjs(date).startOf("day").format(format);
      endDate = dayjs(date).add(7, "day").format(format);

      return `${startDate} - ${endDate} ${yearDate}`;
    default:
      return dayjs(date).format(format);
  }
};

const CalendarToolbar = (props) => {
  const [open, setOpen] = useState(false);
  const { isLoadingData, isFetchingData } = useDataViewContext();

  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-6">
        <Button size="sm" onClick={() => props.onNavigate(Navigate.TODAY)}>
          {Navigate.TODAY}
        </Button>
        <div className="flex items-center gap-2">
          <Button
            size="icon-only"
            variant="ghost"
            onClick={() => props.onNavigate(Navigate.PREVIOUS)}
          >
            <ChevronLeft />
          </Button>
          <Button
            size="icon-only"
            variant="ghost"
            onClick={() => props.onNavigate(Navigate.NEXT)}
          >
            <ChevronRight />
          </Button>
        </div>
        <p className="text-lg font-medium">
          {getDateLabel(props.view, props.date)}
        </p>
      </div>

      <div></div>

      <div className="flex items-center gap-2">
        {(isLoadingData || isFetchingData) && (
          <Loader2 className="w-12 h-12 animate-spin mr-2 text-muted-foreground" />
        )}

        <Select value={props.view} onValueChange={props.onView}>
          <SelectTrigger className="capitalize">
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            {props.views.map((view) => (
              <SelectItem className="capitalize" key={view} value={view}>
                {view.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button size="icon-only" variant="ghost" onClick={() => setOpen(true)}>
          <Settings />
        </Button>

        <DataViewModal
          open={open}
          setOpen={setOpen}
          tableId={props.tableId}
          dataViewId={props.dataViewId}
          key={props.dataViewId}
          onSuccess={() => setOpen(false)}
        />
      </div>
    </div>
  );
};

export default CalendarToolbar;
