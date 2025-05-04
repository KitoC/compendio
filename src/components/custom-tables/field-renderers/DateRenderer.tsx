import { FieldRendererProps } from "./index";
import { format, parseISO } from "date-fns";

const DateRenderer = ({ field, value }: FieldRendererProps) => {
  try {
    const dateValue =
      typeof value === "string"
        ? parseISO(value as string)
        : new Date(value as number);

    const isDateTime =
      field.type === "dateTime" ||
      field.type === "createdTime" ||
      field.type === "lastModifiedTime";

    // Use date format from field options if available
    const dateFormat = "MMM d, yyyy";
    let timeFormat = "h:mm a";

    if (field.time_format) {
      timeFormat = field.time_format === "12" ? "h:mm a" : "HH:mm";
    }

    const formattedDate = format(dateValue, dateFormat);

    if (isDateTime) {
      const formattedTime = format(dateValue, timeFormat);
      return (
        <span className="text-sm" title={`${formattedDate} ${formattedTime}`}>
          {formattedDate}{" "}
          <span className="text-muted-foreground">{formattedTime}</span>
        </span>
      );
    }

    return <span className="text-sm">{formattedDate}</span>;
  } catch (error) {
    return <span className="text-sm text-muted-foreground">Invalid date</span>;
  }
};

export default DateRenderer;
