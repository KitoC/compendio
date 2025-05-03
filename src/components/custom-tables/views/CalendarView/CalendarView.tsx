import { useMemo, useCallback, useState } from "react";
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import dayjs from "dayjs";
import { format } from "date-fns";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { CustomTableViewProps } from "../types";
import { uniqBy } from "lodash";
import Loader from "@/components/ui/loader";
import CalendarToolbar from "./CalendarToolbar";
import { useDataViewContext } from "@/contexts/DataViewProvider";
import EventComponent from "./Event";
import { TEMP_RECORD_ID } from "@/contexts/DataViewProvider/DataViewProvider";
import { CalendarContext } from "./CalendarContext";

const DragAndDropCalendar = withDragAndDrop(Calendar);

const localizer = dayjsLocalizer(dayjs);

const getStartAndEndTime = (record, startTimeField, endTimeField) => {
  const startDateValue = record.fields[startTimeField];
  const endDateValue = record.fields[endTimeField];

  const start = dayjs(startDateValue).toDate();
  const end = dayjs(endDateValue).toDate();

  return { start, end };
};

const CalendarView = ({
  table,
  emptyMessage = "No records available",
  dataViewId,
}: CustomTableViewProps) => {
  const {
    dataView,
    isLoadingData,
    updateRecord,
    data = [],
  } = useDataViewContext();

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [draggingEvent, setDraggingEvent] = useState(null);

  const length = 7;

  const groupBy = table.fields.find(
    (f) => f.id === dataView?.config?.groupByField
  );

  const resources = useMemo(() => {
    return groupBy
      ? uniqBy(
          data.map((record) => {
            let value = record.fields[groupBy.name] as string | string[];

            if (Array.isArray(value)) {
              value = value[0];
            }

            return {
              resourceTitle: value?.trim() || "Not Assigned",
              resourceId: value?.trim() || "Not Assigned",
            };
          }),
          "resourceTitle"
        )
      : null;
  }, [data, groupBy]);

  // Find date fields in the table schema
  const dateFields = useMemo(() => {
    return table.fields.filter((field) =>
      ["date", "dateTime", "createdTime", "lastModifiedTime"].includes(
        field.type
      )
    );
  }, [table.fields]);

  const startTimeField = dateFields.find(
    (f) => f.id === dataView?.config?.dateFields.startDate
  );
  const endTimeField = dateFields.find(
    (f) => f.id === dataView?.config?.dateFields.endDate
  );

  // Get the primary field for record display
  const primaryField = useMemo(() => {
    if (table && table.primaryFieldId) {
      return table.fields.find((field) => field.id === table.primaryFieldId);
    }
    return table.fields[0];
  }, [table]);

  // Convert CustomTable records to events for react-big-calendar
  const events = useMemo(() => {
    if (!dataView) return [];

    let records = data;

    if (selectedEvent) {
      records =
        selectedEvent?.id === TEMP_RECORD_ID
          ? [...data, selectedEvent]
          : data.map((record) => {
              if (record.id === selectedEvent.id) {
                return selectedEvent;
              }
              return record;
            });
    }

    return records
      .map((record) => {
        const { start, end } = getStartAndEndTime(
          record,
          startTimeField?.name,
          endTimeField?.name
        );

        const { eventLabelField } = dataView.config;

        let title = primaryField ? record.fields[primaryField.name] : record.id;

        if (eventLabelField) {
          title = eventLabelField
            .map((field) => record.fields[field.label])
            .filter(Boolean)
            .join(" ");
        }

        return {
          id: record.id,
          title: title || "(no title)",
          start,
          end,
          allDay: !startTimeField && !endTimeField,
          resource: record,
          resourceId: record.fields[groupBy?.name],
        };
      })
      .filter(Boolean);
  }, [
    data,
    primaryField,
    startTimeField,
    endTimeField,
    groupBy,
    dataView,
    selectedEvent,
  ]);

  const getFormattedDates = useCallback(
    (start, end) => {
      const dateField = table.fields.find(
        (field) => field.name === startTimeField.name
      );
      let startDate = start;
      let endDate = end;

      if (dateField?.type === "dateTime") {
        // For dateTime fields, we need to keep the ISO format
        startDate = startDate.toISOString();
        endDate = endDate.toISOString();
      } else {
        // For date fields, we only care about the date part
        startDate = format(startDate, "yyyy-MM-dd");
        endDate = format(endDate, "yyyy-MM-dd");
      }

      return { [startTimeField.name]: startDate, [endTimeField.name]: endDate };
    },
    [startTimeField, endTimeField, table.fields]
  );

  const updateRecordDateRange = useCallback(
    (event, start, end) => {
      const updatedRecord = { ...event.resource };
      updatedRecord.fields = {
        ...updatedRecord.fields,
        ...getFormattedDates(start, end),
      };

      if (event.id === TEMP_RECORD_ID) {
        setSelectedEvent(updatedRecord);
      } else {
        updateRecord({ record: updatedRecord, options: { optimistic: true } });
      }
    },
    [updateRecord, getFormattedDates, setSelectedEvent]
  );

  // Handle event move (drag and drop)
  const handleEventDrop = useCallback(
    ({ event, start, end }) => {
      setDraggingEvent(null);

      updateRecordDateRange(event, start, end);
    },
    [updateRecordDateRange]
  );

  const handleEventResize = useCallback(
    ({ event, start, end }) => {
      updateRecordDateRange(event, start, end);
    },
    [updateRecordDateRange]
  );

  const onSelectSlot = useCallback(
    ({ start, end, ...rest }) => {
      if (selectedEvent) {
        setSelectedEvent(null);
      } else {
        setDraggingEvent(null);
        setSelectedEvent({
          id: TEMP_RECORD_ID,
          fields: {
            [startTimeField.name]: start.toISOString(),
            [endTimeField.name]: end.toISOString(),
          },
        });
      }
    },
    [startTimeField, endTimeField, selectedEvent]
  );

  const components = useMemo(() => {
    return {
      toolbar: (props) => (
        <CalendarToolbar
          {...props}
          length={length}
          dataViewId={dataViewId}
          tableId={table.external_id}
        />
      ),
      event: EventComponent,
      // eventWrapper: (props) => props.children,
    };
  }, [dataViewId, table.external_id, length]);

  if (isLoadingData) {
    return (
      <div className="p-8 flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  // When no date fields are available
  if (dateFields.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">
          Calendar view requires date fields in your table.
        </p>
      </div>
    );
  }

  return (
    <CalendarContext.Provider
      value={{
        draggingEvent,
        setSelectedEvent,
        dataView,
        table,
        primaryField,
        selectedEvent,
      }}
    >
      <div className="h-full flex flex-col">
        <div className="flex-grow overflow-hidden">
          {events.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            <div className="h-full ">
              <DragAndDropCalendar
                selectable
                components={components}
                defaultView={dataView?.config?.calendarViews?.defaultView}
                events={events}
                localizer={localizer}
                resources={resources}
                resourceIdAccessor="resourceId"
                resourceTitleAccessor="resourceTitle"
                onSelectSlot={onSelectSlot}
                onEventDrop={handleEventDrop}
                onEventResize={handleEventResize}
                step={30}
                length={length}
                views={dataView?.config?.calendarViews?.views}
                resourceGroupingLayout={true}
                resizable
                onDragStart={(event) => setDraggingEvent(event)}
                onSelectEvent={() => setDraggingEvent(null)}
              />
            </div>
          )}
        </div>
      </div>
    </CalendarContext.Provider>
  );
};

export default CalendarView;
