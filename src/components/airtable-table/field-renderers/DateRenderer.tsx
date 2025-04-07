
import React from 'react';
import { FieldRendererProps } from './index';
import { format, parseISO } from 'date-fns';

const DateRenderer = ({ field, value }: FieldRendererProps) => {
  try {
    const dateValue = typeof value === 'string' ? parseISO(value) : new Date(value);
    const isDateTime = field.type === 'dateTime' || field.type === 'createdTime' || field.type === 'lastModifiedTime';
    
    // Use date format from field options if available
    let dateFormat = 'MMM d, yyyy';
    let timeFormat = 'h:mm a';
    
    if (field.options?.dateFormat) {
      // This is simplified - you would map Airtable's format to date-fns format
      dateFormat = field.options.dateFormat.format || dateFormat;
    }
    
    if (field.options?.timeFormat) {
      timeFormat = field.options.timeFormat.format || timeFormat;
    }
    
    const formattedDate = format(dateValue, dateFormat);
    
    if (isDateTime) {
      const formattedTime = format(dateValue, timeFormat);
      return (
        <span className="text-sm" title={`${formattedDate} ${formattedTime}`}>
          {formattedDate} <span className="text-muted-foreground">{formattedTime}</span>
        </span>
      );
    }
    
    return <span className="text-sm">{formattedDate}</span>;
  } catch (error) {
    return <span className="text-sm text-muted-foreground">Invalid date</span>;
  }
};

export default DateRenderer;
