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
    let dateFormat = "MMM d, yyyy";
    let timeFormat = "h:mm a";

    if (field.options?.dateFormat) {
      // Map Airtable date formats to date-fns formats
      const airtableToDatFnsFormatMap: Record<string, string> = {
        l: "MM/dd/yyyy", // local format
        LL: "MMMM d, yyyy", // friendly format
        "M/D/YYYY": "MM/dd/yyyy", // US format
        "D/M/YYYY": "dd/MM/yyyy", // European format
        "YYYY-MM-DD": "yyyy-MM-dd", // ISO format
      };

      const formatString = field.options.dateFormat.format;
      dateFormat = formatString
        ? airtableToDatFnsFormatMap[formatString] || formatString
        : dateFormat;
    }

    if (field.options?.timeFormat) {
      timeFormat = field.options.timeFormat.format || timeFormat;
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
