import { useMemo, useState, useCallback } from "react";
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import dayjs from "dayjs";
import { format } from "date-fns";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { uniqBy } from "lodash";
import {
  CalendarViewProps,
  CalendarEvent as CalendarEventType,
  CalendarResource,
} from "./types";
import CalendarToolbar from "./CalendarToolbar";
import CalendarEvent from "./CalendarEvent";
import { SelectOption } from "@/types/customTable";
import "./calendar-style-overrides.css";

const DragAndDropCalendar = withDragAndDrop(Calendar);
const localizer = dayjsLocalizer(dayjs);

const NOT_ASSIGNED_RESOURCE_ID = "NOT_ASSIGNED";
const NOT_ASSIGNED_RESOURCE_TITLE = "Not Assigned";

export function CalendarView<T extends Record<string, unknown>>({
  data,
  count,
  isLoading,
  isFetching,
  query,
  setQuery,
  startDateField,
  endDateField,
  titleField,
  resourceField,
  onEventClick,
  onEventMove,
  onEventResize,
  emptyMessage = "No records available",
  permissions,
}: CalendarViewProps<T>) {
  const [view, setView] = useState<"month" | "week" | "day" | "agenda">(
    "month"
  );
  const [date, setDate] = useState(new Date());

  // Convert data to resources if resourceField is provided
  const resources = useMemo(() => {
    if (!resourceField) return null;

    return [
      ...uniqBy(
        data
          .map((record) => {
            const value = record[resourceField] as
              | SelectOption
              | SelectOption[];

            if (Array.isArray(value)) {
              return value.map((v) => ({
                resourceTitle: v.label?.trim(),
                resourceId: v.value?.trim(),
                data: v,
              }));
            }

            const { label, value: resourceId } = value || {};

            return {
              resourceTitle: label?.trim(),
              resourceId: resourceId?.trim(),
              data: value,
            };
          })
          .flat(),
        "resourceTitle"
      ),
      {
        resourceTitle: NOT_ASSIGNED_RESOURCE_TITLE,
        resourceId: NOT_ASSIGNED_RESOURCE_ID,
      },
    ];
  }, [data, resourceField]);

  // Convert records to calendar events
  const events = useMemo(() => {
    return data
      .map((record) => {
        const start = dayjs(
          record[startDateField] as string | number | Date
        ).toDate();
        const end = dayjs(
          record[endDateField] as string | number | Date
        ).toDate();
        const title = String(record[titleField] || "(no title)");

        const eventFields = {
          id: String(record.id),
          title,
          start,
          end,
          allDay: !startDateField && !endDateField,
          resource: record,
        };

        if (resourceField) {
          const resourceValue = record[resourceField] as
            | SelectOption
            | SelectOption[];
          const isArray = Array.isArray(resourceValue);

          if (isArray && resourceValue.length) {
            return resourceValue.map((v) => ({
              ...eventFields,
              resourceId: v.value,
            }));
          } else if (isArray && !resourceValue.length) {
            return {
              ...eventFields,
              resourceId: NOT_ASSIGNED_RESOURCE_ID,
            };
          }

          return {
            ...eventFields,
            resourceId:
              (resourceValue as SelectOption)?.value ||
              NOT_ASSIGNED_RESOURCE_ID,
          };
        }

        return eventFields;
      })
      .flat();
  }, [data, startDateField, endDateField, titleField, resourceField]);

  const handleNavigate = useCallback(
    (action: "PREV" | "NEXT" | "TODAY") => {
      const newDate = new Date(date);
      switch (action) {
        case "PREV":
          newDate.setMonth(newDate.getMonth() - 1);
          break;
        case "NEXT":
          newDate.setMonth(newDate.getMonth() + 1);
          break;
        case "TODAY":
          newDate.setTime(Date.now());
          break;
      }
      setDate(newDate);
    },
    [date]
  );

  const handleViewChange = useCallback(
    (newView: "month" | "week" | "day" | "agenda") => {
      setView(newView);
    },
    []
  );

  const handleEventDrop = useCallback(
    async ({ event, start, end }) => {
      if (onEventMove) {
        await onEventMove(event, start, end);
      }
    },
    [onEventMove]
  );

  const handleEventResize = useCallback(
    async ({ event, start, end }) => {
      if (onEventResize) {
        await onEventResize(event, start, end);
      }
    },
    [onEventResize]
  );

  return (
    <div className="h-full flex flex-col">
      <CalendarToolbar
        onNavigate={handleNavigate}
        onView={handleViewChange}
        date={date}
        view={view}
      />
      <div className="flex-grow">
        <DragAndDropCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          view={view}
          onView={handleViewChange}
          date={date}
          onNavigate={handleNavigate}
          components={{
            event: CalendarEvent,
            toolbar: CalendarToolbar,
          }}
          draggableAccessor={() => true}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          resources={resources || undefined}
          resourceIdAccessor="resourceId"
          resourceTitleAccessor="resourceTitle"
          onSelectEvent={onEventClick}
        />
      </div>
    </div>
  );
}

export default CalendarView;
