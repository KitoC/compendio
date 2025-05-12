import { ServiceQuery } from "@/services/supabase/BaseService";
import { SelectOption } from "@/types/customTable";

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource: Record<string, unknown>;
  resourceId?: string;
}

export interface CalendarResource {
  resourceTitle: string;
  resourceId: string;
  data?: SelectOption;
}

export interface CalendarViewProps<T extends Record<string, unknown>> {
  data: T[];
  count: number;
  isLoading: boolean;
  isFetching: boolean;
  query: ServiceQuery;
  setQuery: (query: ServiceQuery) => void;
  startDateField: string;
  endDateField: string;
  titleField: string;
  resourceField?: string;
  onEventClick?: (event: CalendarEvent) => void;
  onEventMove?: (event: CalendarEvent, start: Date, end: Date) => Promise<void>;
  onEventResize?: (
    event: CalendarEvent,
    start: Date,
    end: Date
  ) => Promise<void>;
  emptyMessage?: string;
  permissions?: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
  };
}

export interface CalendarToolbarProps {
  onNavigate: (action: "PREV" | "NEXT" | "TODAY") => void;
  onView: (view: "month" | "week" | "day" | "agenda") => void;
  date: Date;
  view: "month" | "week" | "day" | "agenda";
}

export interface CalendarEventProps {
  event: CalendarEvent;
  title: string;
  isAllDay?: boolean;
  onClick?: (event: CalendarEvent) => void;
}
