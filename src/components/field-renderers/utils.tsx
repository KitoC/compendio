import { TimeSettings } from "@/contexts/UserSettingsProvider/UserSettingsContext";
import dayjs from "dayjs";
import { FieldRenderOptions } from "@/types/fieldTypes";

export const formatValue = (
  value: unknown,
  field: FieldRenderOptions,
  timeSettings: TimeSettings
): React.ReactNode => {
  if (field.dateFormat && field.dateIncludeTime) {
    const timeStr = dayjs(value as string)
      .tz(timeSettings.timeZone)
      .format(timeSettings.timeFormat === "12h" ? "h:mm a" : "HH:mm");

    const dateStr = dayjs(value as string)
      .tz(timeSettings.timeZone)
      .format(timeSettings.dateFormat);

    return (
      <span className="text-sm" title={`${dateStr} ${timeStr}`}>
        {dateStr} <span className="text-muted-foreground">{timeStr}</span>
      </span>
    );
  }

  if (field.dateFormat && !field.dateIncludeTime) {
    return dayjs(value as string)
      .tz(timeSettings.timeZone)
      .format(timeSettings.dateFormat);
  }

  return <>{value as string | number}</>;
};
