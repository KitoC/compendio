import { CalendarEventProps } from "./types";

export function CalendarEvent({
  event,
  title,
  isAllDay,
  onClick,
}: CalendarEventProps) {
  return (
    <div
      className="h-full w-full p-1 cursor-pointer hover:bg-primary/5 rounded"
      onClick={() => onClick?.(event)}
    >
      <div className="font-medium text-sm truncate">{title}</div>
      {!isAllDay && (
        <div className="text-xs text-muted-foreground">
          {event.start.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}
    </div>
  );
}

export default CalendarEvent;
