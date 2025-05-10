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
import { SelectOption } from "@/types/customTable";
const DragAndDropCalendar = withDragAndDrop(Calendar);

const localizer = dayjsLocalizer(dayjs);

const getStartAndEndTime = (record, startTimeField, endTimeField) => {
  const startDateValue = record[startTimeField];
  const endDateValue = record[endTimeField];

  const start = dayjs(startDateValue).toDate();
  const end = dayjs(endDateValue).toDate();

  return { start, end };
};

const CalendarView = ({
  emptyMessage = "No records available",
  dataViewId,
}: CustomTableViewProps) => {
  const {
    dataView,
    updateRecord,
    data = [],
    isLoadingData,
    table,
  } = useDataViewContext();

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [draggingEvent, setDraggingEvent] = useState(null);

  const NOT_ASSIGNED_RESOURCE_ID = "NOT_ASSIGNED";
  const NOT_ASSIGNED_RESOURCE_TITLE = "Not Assigned";

  const length = 7;

  const groupBy = table.fields.find(
    (f) => f.id === dataView?.config?.groupByField
  );

  const resources = useMemo(() => {
    return groupBy
      ? [
          ...uniqBy(
            data
              .map((record) => {
                const value = record[groupBy.name] as
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
        ]
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
    (f) => f.id === dataView?.config?.dateFields?.startDate
  );
  const endTimeField = dateFields.find(
    (f) => f.id === dataView?.config?.dateFields?.endDate
  );

  // Get the primary field for record display
  const primaryField = useMemo(() => {
    if (table && table.primary_field_id) {
      return table.fields.find((field) => field.id === table.primary_field_id);
    }
    return table.fields[0];
  }, [table]);

  // Convert CustomTable records to events for react-big-calendar
  const events = useMemo(() => {
    if (!dataView) return [];

    let records = data;

    if (selectedEvent) {
      records =
        selectedEvent?._id === TEMP_RECORD_ID
          ? [...data, selectedEvent]
          : data.map((record) => {
              if (record._id === selectedEvent._id) {
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

        let title = primaryField ? record[primaryField.name] : record._id;

        if (eventLabelField) {
          title = eventLabelField
            .map((field) => record[field.label])
            .filter(Boolean)
            .join(" ");
        }

        const resourceField = record[groupBy?.name] as
          | SelectOption
          | SelectOption[];
        const isArray = Array.isArray(resourceField);
        const eventFields = {
          id: record._id,
          title: title || "(no title)",
          start,
          end,
          allDay: !startTimeField && !endTimeField,
          resource: record,
        };

        if (isArray && resourceField.length) {
          return resourceField.map((v) => ({
            ...eventFields,
            resourceId: v.value,
          }));
        } else if (isArray && !resourceField.length) {
          return {
            ...eventFields,
            resourceId: NOT_ASSIGNED_RESOURCE_ID,
          };
        }

        return {
          id: record._id,
          title: title || "(no title)",
          start,
          end,
          allDay: !startTimeField && !endTimeField,
          resource: record,
          resourceId:
            (resourceField as SelectOption)?.value || NOT_ASSIGNED_RESOURCE_ID,
        };
      })
      .flat()
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
      let updatedRecord = { ...event.resource };

      updatedRecord = {
        ...updatedRecord,
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
    ({ start, end, resourceId, ...rest }) => {
      const resource = resources.find((r) => r.resourceId === resourceId);

      if (selectedEvent) {
        setSelectedEvent(null);
      } else {
        setDraggingEvent(null);
        const newEvent = {
          _id: TEMP_RECORD_ID,
          [startTimeField.name]: start.toISOString(),
          [endTimeField.name]: end.toISOString(),
        };

        if (resource?.data) {
          newEvent[groupBy?.name] = [resource.data];
        }
        setSelectedEvent(newEvent);
      }
    },
    [startTimeField, endTimeField, selectedEvent, groupBy, resources]
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

  // if (isLoadingData) {
  //   return (
  //     <div className="p-8 flex justify-center items-center">
  //       <Loader />
  //     </div>
  //   );
  // }

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
          <div className="flex h-full">
            {/* <div className="w-1/4">
              <div className="h-full p-1 relative rounded-md overflow-hidden flex-grow">
                <div className="h-full p-1 relative rounded-md overflow-hidden flex-grow">
                  <div className="h-full p-1 relative rounded-md overflow-hidden flex-grow"></div>
                </div>
              </div>
            </div> */}
            <div className="h-full p-1 relative rounded-md overflow-hidden flex-grow">
              {isLoadingData && (
                <div className="absolute inset-0 flex items-center justify-center z-40 bg-background/75 animate-fade-in">
                  <Loader className="w-4 h-4" />
                </div>
              )}
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
          </div>
        </div>
      </div>
    </CalendarContext.Provider>
  );
};

export default CalendarView;
