import { useState, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parseISO, isValid } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AirtableViewProps } from "./types";
import { formatFieldValue } from "../utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const CalendarView = ({
  records,
  table,
  onRowClick,
  onUpdate,
  emptyMessage = "No records available",
}: AirtableViewProps) => {
  const [currentView, setCurrentView] = useState<"month" | "week" | "day" | "agenda">("month");
  const [selectedDateField, setSelectedDateField] = useState<string | null>(null);

  // Find date fields in the table schema
  const dateFields = useMemo(() => {
    return table.fields.filter((field) =>
      ["date", "dateTime", "createdTime", "lastModifiedTime"].includes(
        field.type
      )
    );
  }, [table.fields]);

  // Use the first date field as the default calendar field if not already selected
  useMemo(() => {
    if (dateFields.length > 0 && !selectedDateField) {
      setSelectedDateField(dateFields[0].name);
    }
  }, [dateFields, selectedDateField]);

  // Get the primary field for record display
  const primaryField = useMemo(() => {
    if (table && table.primaryFieldId) {
      return table.fields.find((field) => field.id === table.primaryFieldId);
    }
    return table.fields[0];
  }, [table]);

  // Convert Airtable records to events for react-big-calendar
  const events = useMemo(() => {
    if (!selectedDateField) return [];

    return records
      .filter(record => record.fields[selectedDateField])
      .map(record => {
        const dateValue = record.fields[selectedDateField];
        let start = null;
        let end = null;

        if (typeof dateValue === "string") {
          const parsedDate = parseISO(dateValue);
          if (isValid(parsedDate)) {
            start = parsedDate;
            // Default end time is 1 hour after start
            end = new Date(parsedDate.getTime() + 60 * 60 * 1000);
          }
        } else if (dateValue instanceof Date) {
          start = dateValue;
          // Default end time is 1 hour after start
          end = new Date(dateValue.getTime() + 60 * 60 * 1000);
        }

        // Skip records with invalid dates
        if (!start) return null;

        const title = primaryField
          ? formatFieldValue(
              record.fields[primaryField.name],
              primaryField,
              record
            )
          : record.id;

        return {
          id: record.id,
          title,
          start,
          end,
          allDay: false,
          resource: record,
        };
      })
      .filter(Boolean);
  }, [records, selectedDateField, primaryField]);

  // Handle event selection (clicking on an event)
  const handleSelectEvent = useCallback((event) => {
    onRowClick(event.resource);
  }, [onRowClick]);

  // Handle event move (drag and drop)
  const handleEventDrop = useCallback(({ event, start, end }) => {
    if (!onUpdate) {
      toast.warning("You don't have permission to update records");
      return;
    }

    // Create a new record with the updated date
    const updatedRecord = { ...event.resource };
    updatedRecord.fields = { ...updatedRecord.fields };
    
    // Format the date based on field type
    const dateField = table.fields.find((field) => field.name === selectedDateField);
    if (dateField?.type === "dateTime") {
      // For dateTime fields, we need to keep the ISO format
      updatedRecord.fields[selectedDateField] = start.toISOString();
    } else {
      // For date fields, we only care about the date part
      updatedRecord.fields[selectedDateField] = format(start, "yyyy-MM-dd");
    }

    // Update the record
    onUpdate(updatedRecord).then(() => {
      toast.success("Event updated successfully");
    }).catch((error) => {
      console.error("Failed to update event:", error);
      toast.error("Failed to update event");
    });
  }, [onUpdate, selectedDateField, table.fields]);

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

  // Custom event component to show more information
  const EventComponent = ({ event }) => (
    <div className="text-xs overflow-hidden text-ellipsis whitespace-nowrap">
      <Badge variant="secondary" className="mr-1">
        {event.title}
      </Badge>
    </div>
  );

  return (
    <Card className="p-4 h-full flex flex-col">
      <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="space-y-2 w-full sm:w-1/3">
          <label className="text-sm font-medium">Date Field</label>
          <Select
            value={selectedDateField || ""}
            onValueChange={setSelectedDateField}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select date field" />
            </SelectTrigger>
            <SelectContent>
              {dateFields.map((field) => (
                <SelectItem key={field.id} value={field.name}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2 w-full sm:w-1/3">
          <label className="text-sm font-medium">Calendar View</label>
          <Select
            value={currentView}
            onValueChange={(value) => setCurrentView(value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="agenda">Agenda</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex-grow">
        {events.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <Calendar
            localizer={{
              format: (value, format) => format(value, format),
              formats: {
                dateFormat: 'dd',
                dayFormat: 'dd ddd',
                monthHeaderFormat: 'MMMM yyyy',
                dayHeaderFormat: 'dddd MMM dd',
                dayRangeHeaderFormat: ({ start, end }) => `${format(start, 'MMM dd')} - ${format(end, 'MMM dd')}`,
              },
              startOfWeek: 0,
            }}
            events={events}
            views={['month', 'week', 'day', 'agenda']}
            step={60}
            showMultiDayTimes
            defaultDate={new Date()}
            components={{
              event: EventComponent,
            }}
            onSelectEvent={handleSelectEvent}
            onEventDrop={handleEventDrop}
            selectable
            resizable
            style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}
            view={currentView}
            onView={setCurrentView as any}
            dragAndDropEnabled={!!onUpdate}
            resizableAccessor={() => !!onUpdate}
          />
        )}
      </div>
    </Card>
  );
};

export default CalendarView;
