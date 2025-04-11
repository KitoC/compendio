
import { useMemo, useState, useRef, useEffect } from "react";
import { 
  format, 
  isValid, 
  parseISO, 
  differenceInDays, 
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  addMonths,
  addQuarters,
  addYears,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachQuarterOfInterval,
  eachYearOfInterval,
  isSameDay,
  isSameMonth,
  isSameQuarter,
  isSameYear
} from "date-fns";
import { AirtableViewProps, TimeScale } from "./types";
import { formatFieldValue } from "../utils";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  
  // Reference for scroll container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Get date range based on time scale
  const getDateRange = (startDate: Date, scale: TimeScale) => {
    switch (scale) {
      case "day":
        return { 
          start: startDate, 
          end: startDate,
          prev: () => addDays(startDate, -1),
          next: () => addDays(startDate, 1)
        };
      case "week":
        return { 
          start: startOfWeek(startDate, { weekStartsOn: 1 }), 
          end: endOfWeek(startDate, { weekStartsOn: 1 }),
          prev: () => addWeeks(startDate, -1),
          next: () => addWeeks(startDate, 1)
        };
      case "fortnight":
        return { 
          start: startOfWeek(startDate, { weekStartsOn: 1 }), 
          end: endOfWeek(addWeeks(startDate, 1), { weekStartsOn: 1 }),
          prev: () => addWeeks(startDate, -2),
          next: () => addWeeks(startDate, 2)
        };
      case "month":
        return { 
          start: startOfMonth(startDate), 
          end: endOfMonth(startDate),
          prev: () => addMonths(startDate, -1),
          next: () => addMonths(startDate, 1)
        };
      case "quarter":
        return { 
          start: startOfQuarter(startDate), 
          end: endOfQuarter(startDate),
          prev: () => addQuarters(startDate, -1),
          next: () => addQuarters(startDate, 1)
        };
      case "year":
        return { 
          start: startOfYear(startDate), 
          end: endOfYear(startDate),
          prev: () => addYears(startDate, -1),
          next: () => addYears(startDate, 1)
        };
      default:
        return { 
          start: startDate, 
          end: addDays(startDate, 6),
          prev: () => addDays(startDate, -7),
          next: () => addDays(startDate, 7)
        };
    }
  };

  // Calculate visible date range
  const { start: viewStart, end: viewEnd, prev, next } = useMemo(() => {
    return getDateRange(currentViewStart, timeScale);
  }, [currentViewStart, timeScale]);

  // Add padding to visible range for smoother scrolling
  const { minDate, maxDate } = useMemo(() => {
    let additionalDays = 0;
    let additionalBefore = 0;
    let additionalAfter = 0;
    
    switch (timeScale) {
      case "day":
        additionalBefore = additionalAfter = 3;
        break;
      case "week":
        additionalBefore = additionalAfter = 7;
        break;
      case "fortnight":
        additionalBefore = additionalAfter = 14;
        break;
      case "month":
        additionalBefore = additionalAfter = 14;
        break;
      case "quarter":
        additionalBefore = additionalAfter = 30;
        break;
      case "year":
        additionalBefore = additionalAfter = 60;
        break;
    }
    
    return { 
      minDate: addDays(viewStart, -additionalBefore),
      maxDate: addDays(viewEnd, additionalAfter)
    };
  }, [viewStart, viewEnd, timeScale]);

  // Generate timeline intervals based on time scale
  const timelineDates = useMemo(() => {
    const interval = { start: minDate, end: maxDate };
    
    switch (timeScale) {
      case "day":
        return eachDayOfInterval(interval).map(date => ({
          date,
          label: format(date, 'd'),
          subLabel: format(date, 'EEE'),
          isFirst: date.getDate() === 1,
          isPrimary: isSameDay(date, viewStart)
        }));
      case "week":
        return eachDayOfInterval(interval).map(date => ({
          date,
          label: format(date, 'd'),
          subLabel: format(date, 'EEE'),
          isFirst: date.getDate() === 1,
          isPrimary: date.getDay() === 1
        }));
      case "fortnight":
        return eachDayOfInterval(interval).map(date => ({
          date,
          label: format(date, 'd'),
          subLabel: format(date, 'EEE'),
          isFirst: date.getDate() === 1,
          isPrimary: date.getDay() === 1
        }));
      case "month":
        return eachDayOfInterval(interval).map(date => ({
          date,
          label: format(date, 'd'),
          subLabel: format(date, 'EEE'),
          isFirst: date.getDate() === 1,
          isPrimary: date.getDate() === 1
        }));
      case "quarter":
        return eachMonthOfInterval(interval).map(date => ({
          date,
          label: format(date, 'MMM'),
          subLabel: format(date, 'yyyy'),
          isFirst: date.getMonth() % 3 === 0,
          isPrimary: date.getMonth() % 3 === 0
        }));
      case "year":
        return eachMonthOfInterval(interval).map(date => ({
          date,
          label: format(date, 'MMM'),
          subLabel: "",
          isFirst: date.getMonth() === 0,
          isPrimary: date.getMonth() === 0
        }));
      default:
        return eachDayOfInterval(interval).map(date => ({
          date,
          label: format(date, 'd'),
          subLabel: format(date, 'EEE'),
          isFirst: date.getDate() === 1,
          isPrimary: false
        }));
    }
  }, [minDate, maxDate, timeScale, viewStart]);

  // Get column width based on time scale
  const getColumnWidth = () => {
    switch (timeScale) {
      case "day": return "10rem";
      case "week": return "4rem";  
      case "fortnight": return "3rem";
      case "month": return "2.5rem";
      case "quarter": return "8rem";
      case "year": return "5rem";
      default: return "4rem";
    }
  };

  // Navigate to previous/next time period
  const handlePrevious = () => setCurrentViewStart(prev);
  const handleNext = () => setCurrentViewStart(next);
  const handleToday = () => setCurrentViewStart(new Date());

  // Reset to appropriate view when time scale changes
  useEffect(() => {
    setCurrentViewStart(today);
  }, [timeScale]);

  // Calculate item positions based on timeline
  const getItemPositionStyle = (item: {startDate: Date, endDate: Date}) => {
    let startPosition = 0;
    let duration = 0;
    
    // Find the matching time unit for the start date
    const startIndex = timelineDates.findIndex(d => {
      switch (timeScale) {
        case "day": return isSameDay(d.date, item.startDate);
        case "week": case "fortnight": case "month": return isSameDay(d.date, item.startDate);
        case "quarter": return isSameMonth(d.date, item.startDate);
        case "year": return isSameMonth(d.date, item.startDate);
        default: return isSameDay(d.date, item.startDate);
      }
    });
    
    if (startIndex !== -1) {
      startPosition = startIndex;
      
      // Find or estimate the end position
      const endIndex = timelineDates.findIndex(d => {
        switch (timeScale) {
          case "day": return isSameDay(d.date, item.endDate);
          case "week": case "fortnight": case "month": return isSameDay(d.date, item.endDate);
          case "quarter": return isSameMonth(d.date, item.endDate);
          case "year": return isSameMonth(d.date, item.endDate);
          default: return isSameDay(d.date, item.endDate);
        }
      });
      
      duration = endIndex !== -1 ? (endIndex - startIndex + 1) : 1;
    } else {
      // If start date is before the visible range, calculate offset
      if (item.startDate < minDate) {
        startPosition = 0;
        const endIndex = timelineDates.findIndex(d => {
          switch (timeScale) {
            case "day": return isSameDay(d.date, item.endDate);
            case "week": case "fortnight": case "month": return isSameDay(d.date, item.endDate);
            case "quarter": return isSameMonth(d.date, item.endDate);
            case "year": return isSameMonth(d.date, item.endDate);
            default: return isSameDay(d.date, item.endDate);
          }
        });
        duration = endIndex !== -1 ? (endIndex + 1) : 1;
      } else {
        // Start date is after the visible range
        return { display: "none" };
      }
    }
    
    // Ensure minimum width
    duration = Math.max(duration, 1);
    
    const colWidth = getColumnWidth();
    const numericWidth = parseInt(colWidth.replace(/[^\d.]/g, ''), 10);
    
    return { 
      left: `calc(${startPosition} * ${colWidth})`, 
      width: `calc(${duration} * ${colWidth} - 0.25rem)`,
      minWidth: "2rem",
      display: "flex"
    };
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

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-md">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const columnWidth = getColumnWidth();

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

      {timelineItems.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto" ref={scrollContainerRef}>
            <div className="min-w-max">
              {/* Timeline header - dates */}
              <div className="flex border-b sticky top-0 bg-background z-10">
                <div className="w-48 shrink-0 p-3 border-r font-medium">
                  Item
                </div>
                <div className="flex">
                  {timelineDates.map((dateInfo, index) => (
                    <div 
                      key={index} 
                      className={`shrink-0 p-2 text-center text-xs border-r
                        ${dateInfo.isFirst ? 'bg-muted' : ''}
                        ${dateInfo.isPrimary ? 'text-primary font-medium' : ''}
                        ${dateInfo.date.getDay() === 0 || dateInfo.date.getDay() === 6 ? 'text-muted-foreground' : ''}
                      `}
                      style={{ width: columnWidth }}
                    >
                      {dateInfo.label}
                      <div className="text-[10px] text-muted-foreground">
                        {dateInfo.subLabel}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Timeline body */}
              <div>
                {timelineItems.map(item => {
                  const positionStyle = getItemPositionStyle(item);
                  
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
                        {/* Item on timeline */}
                        <div 
                          className="absolute cursor-pointer h-8 rounded-md border bg-blue-100 border-blue-300 top-1/2 -translate-y-1/2 flex items-center justify-center px-2"
                          style={positionStyle}
                          onClick={() => onRowClick(item.record)}
                        >
                          <span className="text-xs font-medium truncate overflow-hidden">
                            {timeScale === "day" || timeScale === "week" || positionStyle.width.includes("8") ? item.title : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
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
