import { Button } from "@/components/ui/button";
import { Navigate, Views } from "react-big-calendar";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight, Settings } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DataViewModal from "@/components/DataViewModal";
import { useEffect, useMemo, useState } from "react";
import {
  FilterOperator,
  FilterType,
  useDataViewContext,
} from "@/contexts/DataViewProvider/DataViewContext";
import Loader from "@/components/ui/loader";

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

const getDateQuery = (view, date) => {
  switch (view) {
    case Views.MONTH:
      return {
        from: dayjs(date).add(-1, "month").startOf("month"),
        to: dayjs(date).add(1, "month").endOf("month"),
      };
    case Views.WEEK:
      return {
        from: dayjs(date).add(-1, "week").startOf("week"),
        to: dayjs(date).add(1, "week").endOf("week"),
      };
    case Views.WORK_WEEK:
      return {
        from: dayjs(date).add(-1, "week").day(1).startOf("day"),
        to: dayjs(date).add(1, "week").day(5).endOf("day"),
      };
    case Views.DAY:
      return { from: dayjs(date), to: dayjs(date) };
    case Views.AGENDA:
      return {
        from: dayjs(date).add(-1, "day").startOf("day"),
        to: dayjs(date).add(7, "day").endOf("day"),
      };
    default:
      return {
        from: dayjs(date).add(-1, "day").startOf("day"),
        to: dayjs(date).add(1, "day").endOf("day"),
      };
  }
};

const CalendarToolbar = (props) => {
  const { isLoadingData, isFetchingData, dataView, setQuery, onEditDataView } =
    useDataViewContext();

  const { from, to } = useMemo(() => {
    const query = getDateQuery(props.view, props.date);

    return {
      from: query.from.toISOString(),
      to: query.to.toISOString(),
    };
  }, [props.view, props.date]);

  const { startDate, endDate } = useMemo(() => {
    return {
      startDate: dataView?.config.dateFields.startDate,
      endDate: dataView?.config.dateFields.endDate,
    };
  }, [dataView]);

  useEffect(() => {
    const filter = {
      filter_type: FilterOperator.AND,
      filters: [
        { field: startDate, type: FilterType.DATE_AFTER, value: from },
        { field: endDate, type: FilterType.DATE_BEFORE, value: to },
      ],
    };
    setQuery((prev) => ({ ...prev, filter }));
  }, [from, to, startDate, endDate, setQuery]);

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
      <div className="mr-auto ml-8">
        {!isLoadingData && isFetchingData && (
          <div className="flex items-center gap-2">
            <Loader className="w-8 h-8 text-muted-foreground" />
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        )}
      </div>

      <div></div>

      <div className="flex items-center gap-2">
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
      </div>
    </div>
  );
};

export default CalendarToolbar;
