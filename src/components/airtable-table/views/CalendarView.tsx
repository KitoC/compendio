
import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { format, isValid, parseISO, startOfMonth } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { AirtableViewProps } from "./types";
import { formatFieldValue } from "../utils";

const CalendarView = ({
  records,
  table,
  isLoading,
  onRowClick,
  emptyMessage = "No records available",
}: AirtableViewProps) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Find date fields in the table schema
  const dateFields = useMemo(() => {
    return table.fields.filter((field) =>
      ["date", "dateTime", "createdTime", "lastModifiedTime"].includes(
        field.type
      )
    );
  }, [table.fields]);

  // Use the first date field as the default calendar field
  const primaryDateField = useMemo(() => {
    return dateFields.length > 0 ? dateFields[0].name : null;
  }, [dateFields]);

  // Group records by date
  const recordsByDate = useMemo(() => {
    if (!primaryDateField) return {};

    const groupedRecords: Record<string, typeof records> = {};

    records.forEach((record) => {
      const dateValue = record.fields[primaryDateField];
      if (!dateValue) return;

      let dateStr: string | null = null;

      if (typeof dateValue === "string") {
        const parsedDate = parseISO(dateValue);
        if (isValid(parsedDate)) {
          dateStr = format(parsedDate, "yyyy-MM-dd");
        }
      } else if (dateValue instanceof Date) {
        dateStr = format(dateValue, "yyyy-MM-dd");
      }

      if (dateStr) {
        if (!groupedRecords[dateStr]) {
          groupedRecords[dateStr] = [];
        }
        groupedRecords[dateStr].push(record);
      }
    });

    return groupedRecords;
  }, [records, primaryDateField]);

  // Get the primary field for record display
  const primaryField = useMemo(() => {
    if (table && table.primaryFieldId) {
      return table.fields.find((field) => field.id === table.primaryFieldId);
    }
    return table.fields[0];
  }, [table]);

  // Custom render function for calendar days
  const renderDay = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const dayRecords = recordsByDate[dateStr] || [];

    if (dayRecords.length === 0) return null;

    return (
      <div className="absolute bottom-0 left-0 right-0 flex justify-center">
        <Badge className="text-xs px-1" variant="secondary">
          {dayRecords.length}
        </Badge>
      </div>
    );
  };

  // When no date fields are available
  if (!primaryDateField) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">
          Calendar view requires date fields in your table.
        </p>
      </div>
    );
  }

  // When a date is selected, show records for that date
  const handleDayClick = (date: Date | undefined) => {
    if (!date) return;

    const dateStr = format(date, "yyyy-MM-dd");
    const dayRecords = recordsByDate[dateStr] || [];

    if (dayRecords.length === 1) {
      // If there's only one record, go directly to it
      onRowClick(dayRecords[0]);
    } else if (dayRecords.length > 1) {
      // If there are multiple records, open a modal or expand to show them
      // For now, we'll just click the first one
      onRowClick(dayRecords[0]);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-md border p-4">
        <Calendar
          mode="single"
          onMonthChange={setCurrentMonth}
          className="w-full"
          modifiers={{
            hasEvents: (date) => {
              const dateStr = format(date, "yyyy-MM-dd");
              return !!recordsByDate[dateStr];
            },
          }}
          modifiersStyles={{
            hasEvents: {
              fontWeight: "bold",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
            },
          }}
          components={{
            Day: ({ date, ...props }) => {
              return (
                <div className="relative" {...props}>
                  {date.getDate()}
                  {renderDay(date)}
                </div>
              );
            },
          }}
          onDayClick={handleDayClick}
          showOutsideDays={false}
        />
      </div>

      <div className="grid gap-2">
        {currentMonth &&
          Object.entries(recordsByDate).map(([dateStr, dayRecords]) => {
            const recordDate = parseISO(dateStr);

            // Only show events for the current month
            if (
              recordDate.getMonth() !== currentMonth.getMonth() ||
              recordDate.getFullYear() !== currentMonth.getFullYear()
            ) {
              return null;
            }

            return (
              <Card key={dateStr} className="overflow-hidden">
                <div className="bg-muted px-4 py-2 font-medium">
                  {format(recordDate, "EEEE, MMMM d, yyyy")}
                </div>
                <CardContent className="p-0">
                  {dayRecords.map((record) => (
                    <div
                      key={record.id}
                      className="px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-muted/50"
                      onClick={() => onRowClick(record)}
                    >
                      <div className="font-medium">
                        {primaryField
                          ? formatFieldValue(
                              record.fields[primaryField.name],
                              primaryField,
                              record
                            )
                          : record.id}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
};

export default CalendarView;
