import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCalendarContext } from "./CalendarContext";
import EventForm from "./EventForm";

// Custom event component to show more information
const EventComponent = ({ event }) => {
  const { selectedEvent, setSelectedEvent, draggingEvent } =
    useCalendarContext();

  return (
    <Popover
      open={
        selectedEvent &&
        selectedEvent?._id === event.resource._id &&
        !draggingEvent
      }
    >
      <PopoverTrigger asChild>
        <div
          className="text-xs overflow-hidden text-ellipsis whitespace-nowrap"
          onClick={() => setSelectedEvent(event.resource)}
        >
          {event.title}
        </div>
      </PopoverTrigger>
      <PopoverContent
        side="left"
        className="w-96 p-0 overflow-auto max-h-screen"
      >
        <EventForm />
      </PopoverContent>
    </Popover>
  );
};

export default EventComponent;
