
import { useMemo, useState } from "react";
import { format, isValid, parseISO, differenceInDays, addDays } from "date-fns";
import { AirtableViewProps } from "./types";
import { formatFieldValue } from "../utils";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const TimelineView = ({
  records,
  table,
  isLoading,
  onRowClick,
  emptyMessage = "No records available",
}: AirtableViewProps) => {
  // Find date fields in the table schema
  const dateFields = useMemo(() => {
    return table.fields.filter(field => 
      ["date", "dateTime", "createdTime", "lastModifiedTime"].includes(field.type)
    );
  }, [table.fields]);

  // State for selected start and end date fields
  const [startDateField, setStartDateField] = useState<string | null>(
    dateFields.length > 0 ? dateFields[0].name : null
  );
  
  const [endDateField, setEndDateField] = useState<string | null>(
    dateFields.length > 1 ? dateFields[1].name : startDateField
  );

  // Get the primary field for the table
  const primaryField = useMemo(() => {
    if (table && table.primaryFieldId) {
      return table.fields.find((field) => field.id === table.primaryFieldId);
    }
    return table.fields[0];
  }, [table]);

  // Process records for timeline display
  const timelineItems = useMemo(() => {
    if (!startDateField) return [];
    
    return records
      .filter(record => {
        const startValue = record.fields[startDateField];
        return startValue !== undefined && startValue !== null;
      })
      .map(record => {
        const startDateValue = record.fields[startDateField];
        let startDate: Date | null = null;
        
        if (typeof startDateValue === 'string') {
          const parsedDate = parseISO(startDateValue);
          if (isValid(parsedDate)) {
            startDate = parsedDate;
          }
        } else if (startDateValue instanceof Date) {
          startDate = startDateValue;
        }
        
        let endDate = startDate;
        if (endDateField && endDateField !== startDateField) {
          const endDateValue = record.fields[endDateField];
          if (typeof endDateValue === 'string') {
            const parsedEndDate = parseISO(endDateValue);
            if (isValid(parsedEndDate)) {
              endDate = parsedEndDate;
            }
          } else if (endDateValue instanceof Date) {
            endDate = endDateValue;
          }
        }
        
        // If we couldn't parse either date, skip this record
        if (!startDate) return null;
        
        // Ensure end date is not before start date
        if (endDate && endDate < startDate) {
          endDate = startDate;
        }
        
        return {
          id: record.id,
          record,
          startDate,
          endDate: endDate || addDays(startDate, 1), // Default to 1-day duration
          title: primaryField ? formatFieldValue(record.fields[primaryField.name], primaryField) : record.id,
        };
      })
      .filter(Boolean) // Remove null entries
      .sort((a, b) => a!.startDate.getTime() - b!.startDate.getTime()) as Array<{
        id: string;
        record: typeof records[0];
        startDate: Date;
        endDate: Date;
        title: string;
      }>;
  }, [records, startDateField, endDateField, primaryField]);

  // Calculate timeline range
  const { minDate, maxDate, dateRange } = useMemo(() => {
    if (timelineItems.length === 0) {
      const now = new Date();
      return { 
        minDate: addDays(now, -15), 
        maxDate: addDays(now, 15),
        dateRange: 30
      };
    }
    
    let min = timelineItems[0].startDate;
    let max = timelineItems[0].endDate;
    
    timelineItems.forEach(item => {
      if (item.startDate < min) min = item.startDate;
      if (item.endDate > max) max = item.endDate;
    });
    
    // Add some padding
    min = addDays(min, -2);
    max = addDays(max, 2);
    
    const range = differenceInDays(max, min) + 1;
    
    return { minDate: min, maxDate: max, dateRange: range };
  }, [timelineItems]);

  // Generate an array of dates for the timeline
  const timelineDates = useMemo(() => {
    const dates: Date[] = [];
    let currentDate = minDate;
    
    while (currentDate <= maxDate) {
      dates.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    
    return dates;
  }, [minDate, maxDate]);

  if (dateFields.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">
          Timeline view requires date fields in your table.
        </p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-md">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <div className="w-full max-w-xs">
          <label className="text-sm font-medium mb-2 block">Start Date Field</label>
          <Select 
            value={startDateField || ""} 
            onValueChange={value => setStartDateField(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a start date field" />
            </SelectTrigger>
            <SelectContent>
              {dateFields.map(field => (
                <SelectItem key={field.id} value={field.name}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full max-w-xs">
          <label className="text-sm font-medium mb-2 block">End Date Field (Optional)</label>
          <Select 
            value={endDateField || ""} 
            onValueChange={value => setEndDateField(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an end date field" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={startDateField || ""}>
                Same as start date
              </SelectItem>
              {dateFields
                .filter(field => field.name !== startDateField)
                .map(field => (
                  <SelectItem key={field.id} value={field.name}>
                    {field.name}
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        </div>
      </div>

      {timelineItems.length > 0 ? (
        <div className="border rounded-md overflow-x-auto">
          <div className="min-w-max">
            {/* Timeline header - dates */}
            <div className="flex border-b sticky top-0 bg-background z-10">
              <div className="w-48 shrink-0 p-3 border-r font-medium">
                Item
              </div>
              <div className="flex">
                {timelineDates.map((date, index) => (
                  <div 
                    key={index} 
                    className={`w-16 shrink-0 p-2 text-center text-xs border-r
                      ${date.getDate() === 1 ? 'bg-muted' : ''}
                      ${date.getDay() === 0 || date.getDay() === 6 ? 'text-muted-foreground' : ''}
                    `}
                  >
                    {format(date, date.getDate() === 1 ? 'MMM d' : 'd')}
                    <div className="text-[10px] text-muted-foreground">
                      {format(date, 'EEE')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Timeline body */}
            <div>
              {timelineItems.map(item => {
                const startPosition = differenceInDays(item.startDate, minDate);
                const duration = differenceInDays(item.endDate, item.startDate) + 1;
                
                return (
                  <div key={item.id} className="flex border-b hover:bg-muted/30">
                    <div 
                      className="w-48 shrink-0 p-3 border-r truncate cursor-pointer"
                      onClick={() => onRowClick(item.record)}
                    >
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(item.startDate, 'MMM d')} 
                        {item.endDate !== item.startDate && ` - ${format(item.endDate, 'MMM d')}`}
                      </div>
                    </div>
                    <div className="relative flex-1" style={{ height: '60px' }}>
                      {/* White background to cover grid lines */}
                      <div 
                        className="absolute cursor-pointer h-8 rounded-md border bg-blue-100 border-blue-300 top-1/2 -translate-y-1/2 flex items-center justify-center px-2"
                        style={{ 
                          left: `${startPosition * 4}rem`, 
                          width: `${duration * 4 - 0.25}rem`,
                          minWidth: '2rem'
                        }}
                        onClick={() => onRowClick(item.record)}
                      >
                        <span className="text-xs font-medium truncate overflow-hidden">
                          {duration > 2 ? item.title : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No records with valid dates found. Please select different date fields.
          </p>
        </Card>
      )}
    </div>
  );
};

export default TimelineView;
