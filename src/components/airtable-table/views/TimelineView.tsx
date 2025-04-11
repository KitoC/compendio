
import React, { useMemo, useState } from "react";
import Timeline from "react-calendar-timeline";
import "react-calendar-timeline/lib/Timeline.css";
import moment from "moment";
import { 
  parseISO, 
  isValid, 
  format, 
  addDays,
  addWeeks,
  addMonths,
  addQuarters,
  addYears,
} from "date-fns";

import { AirtableViewProps, TimeScale } from "./types";
import { formatFieldValue } from "../utils";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const TimelineView = ({
  records,
  table,
  isLoading,
  onRowClick,
  onUpdate,
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

  // State for time scale selection
  const [timeScale, setTimeScale] = useState<TimeScale>("week");
  
  // State for current view range
  const today = new Date();
  const [currentViewStart, setCurrentViewStart] = useState(today);
  
  // Get the primary field for the table
  const primaryField = useMemo(() => {
    if (table && table.primaryFieldId) {
      return table.fields.find((field) => field.id === table.primaryFieldId);
    }
    return table.fields[0];
  }, [table]);

  // Calculate the visible timespan based on the selected time scale
  const getTimeRange = () => {
    const now = moment(currentViewStart);
    let startTime = now.clone();
    let endTime = now.clone();
    
    switch (timeScale) {
      case "day":
        startTime = now.clone().startOf('day');
        endTime = now.clone().endOf('day');
        break;
      case "week":
        startTime = now.clone().startOf('week');
        endTime = now.clone().endOf('week');
        break;
      case "fortnight":
        startTime = now.clone().startOf('week');
        endTime = now.clone().add(2, 'weeks').endOf('week');
        break;
      case "month":
        startTime = now.clone().startOf('month');
        endTime = now.clone().endOf('month');
        break;
      case "quarter":
        startTime = now.clone().startOf('quarter');
        endTime = now.clone().endOf('quarter');
        break;
      case "year":
        startTime = now.clone().startOf('year');
        endTime = now.clone().endOf('year');
        break;
      default:
        startTime = now.clone().startOf('week');
        endTime = now.clone().endOf('week');
    }
    
    return { startTime, endTime };
  };

  const { startTime, endTime } = getTimeRange();

  // Process records for timeline display
  const { groups, items } = useMemo(() => {
    if (!startDateField) return { groups: [], items: [] };
    
    // Create a map for quick access to groups by ID
    const groupMap = new Map();
    const itemsList = [];
    
    // Process each record
    records.forEach((record, index) => {
      const startDateValue = record.fields[startDateField];
      if (startDateValue === undefined || startDateValue === null) return;
      
      let startDate: Date | null = null;
      
      if (typeof startDateValue === 'string') {
        const parsedDate = parseISO(startDateValue);
        if (isValid(parsedDate)) {
          startDate = parsedDate;
        }
      } else if (startDateValue instanceof Date) {
        startDate = startDateValue;
      }
      
      if (!startDate) return;
      
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
      
      // Ensure end date is not before start date
      if (endDate < startDate) {
        endDate = startDate;
      }
      
      // Add one day to make sure the event is visible if start and end are the same
      if (startDate.getTime() === endDate.getTime()) {
        endDate = addDays(endDate, 1);
      }
      
      // Add record as a group if it doesn't exist
      if (!groupMap.has(record.id)) {
        const group = {
          id: record.id,
          title: primaryField ? formatFieldValue(record.fields[primaryField.name], primaryField) : record.id,
          record
        };
        groupMap.set(record.id, group);
      }
      
      // Add timeline item
      itemsList.push({
        id: `${record.id}-item`,
        group: record.id,
        title: primaryField ? formatFieldValue(record.fields[primaryField.name], primaryField) : record.id,
        start_time: moment(startDate),
        end_time: moment(endDate),
        itemProps: {
          style: {
            backgroundColor: '#60a5fa',
            color: 'white',
            borderRadius: '4px',
            border: '1px solid #2563eb',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          },
          onDoubleClick: () => onRowClick(record)
        },
        record // Store the record reference for later use
      });
    });
    
    return {
      groups: Array.from(groupMap.values()),
      items: itemsList
    };
  }, [records, startDateField, endDateField, primaryField]);

  // Navigate to previous/next time period
  const handlePrevious = () => {
    switch (timeScale) {
      case "day":
        setCurrentViewStart(addDays(currentViewStart, -1));
        break;
      case "week":
        setCurrentViewStart(addWeeks(currentViewStart, -1));
        break;
      case "fortnight":
        setCurrentViewStart(addWeeks(currentViewStart, -2));
        break;
      case "month":
        setCurrentViewStart(addMonths(currentViewStart, -1));
        break;
      case "quarter":
        setCurrentViewStart(addQuarters(currentViewStart, -1));
        break;
      case "year":
        setCurrentViewStart(addYears(currentViewStart, -1));
        break;
    }
  };

  const handleNext = () => {
    switch (timeScale) {
      case "day":
        setCurrentViewStart(addDays(currentViewStart, 1));
        break;
      case "week":
        setCurrentViewStart(addWeeks(currentViewStart, 1));
        break;
      case "fortnight":
        setCurrentViewStart(addWeeks(currentViewStart, 2));
        break;
      case "month":
        setCurrentViewStart(addMonths(currentViewStart, 1));
        break;
      case "quarter":
        setCurrentViewStart(addQuarters(currentViewStart, 1));
        break;
      case "year":
        setCurrentViewStart(addYears(currentViewStart, 1));
        break;
    }
  };
  
  const handleToday = () => setCurrentViewStart(new Date());

  // Handle item move if onUpdate is provided
  const handleItemMove = async (itemId: string, dragTime: number, newGroupOrder: number) => {
    if (!onUpdate) return;

    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const record = item.record;
    
    // Calculate the duration of the event
    const originalStart = item.start_time;
    const originalEnd = item.end_time;
    const duration = originalEnd.diff(originalStart);
    
    // Create new start and end times
    const newStartTime = moment(dragTime);
    const newEndTime = moment(dragTime + duration);
    
    // Update the record with new dates
    const updatedRecord = {
      ...record,
      fields: {
        ...record.fields,
        [startDateField as string]: newStartTime.toISOString(),
        ...(endDateField && endDateField !== startDateField ? {
          [endDateField]: newEndTime.toISOString()
        } : {})
      }
    };

    try {
      await onUpdate(updatedRecord);
    } catch (error) {
      console.error("Failed to update record:", error);
    }
  };

  // Handle item resize if onUpdate is provided
  const handleItemResize = async (itemId: string, time: number, edge: string) => {
    if (!onUpdate || !endDateField || endDateField === startDateField) return;

    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const record = item.record;
    const updatedRecord = { ...record };

    if (edge === 'left') {
      // Update start date
      updatedRecord.fields = {
        ...updatedRecord.fields,
        [startDateField as string]: moment(time).toISOString()
      };
    } else {
      // Update end date
      updatedRecord.fields = {
        ...updatedRecord.fields,
        [endDateField]: moment(time).toISOString()
      };
    }

    try {
      await onUpdate(updatedRecord);
    } catch (error) {
      console.error("Failed to update record:", error);
    }
  };

  if (dateFields.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">
          Timeline view requires date fields in your table.
        </p>
      </div>
    );
  }

  if (records.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-md">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4 justify-between">
        <div className="flex gap-4">
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
        
        <div className="flex items-end gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>Today</Button>
          <Button variant="outline" size="sm" onClick={handlePrevious}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={handleNext}><ChevronRight className="w-4 h-4" /></Button>
          <Select value={timeScale} onValueChange={(value) => setTimeScale(value as TimeScale)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time scale" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="fortnight">2 Weeks</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="quarter">Quarter</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="min-w-full overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : items.length > 0 ? (
            <Timeline
              groups={groups}
              items={items}
              defaultTimeStart={startTime}
              defaultTimeEnd={endTime}
              visibleTimeStart={startTime.valueOf()}
              visibleTimeEnd={endTime.valueOf()}
              canResize={!!onUpdate && !!endDateField && endDateField !== startDateField ? "both" : false}
              canMove={!!onUpdate}
              onItemMove={handleItemMove}
              onItemResize={handleItemResize}
              lineHeight={50}
              itemHeightRatio={0.6}
              sidebarWidth={200}
              minZoom={24 * 60 * 60 * 1000} // 1 day minimum zoom
              maxZoom={365 * 24 * 60 * 60 * 1000} // 1 year maximum zoom
              stackItems
              sidebarContent={<div className="p-3 font-medium">Items</div>}
              className="dark:bg-gradient-to-r dark:from-gray-800 dark:to-gray-900"
              timeSteps={{
                day: 1,
                month: 1,
                year: 1,
                hour: 1,
                minute: 15,
                second: 1
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">
                No records with valid dates found. Please select different date fields.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TimelineView;
