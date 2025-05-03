import { IDataView } from "@/services/DataViewsService";
import {
  CustomTableField,
  CustomTableRecord,
  CustomTableSchema,
} from "@/types/customTable";
import { createContext, useContext } from "react";

interface CalendarEvent {
  id?: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: CustomTableRecord;
  resourceId: string;
}

export type CalendarContextType = {
  dataView: IDataView;
  draggingEvent: { event: CalendarEvent } | null;
  setSelectedEvent: (event: CustomTableRecord) => void;
  selectedEvent: CustomTableRecord | null;
  table: CustomTableSchema;
  primaryField: CustomTableField;
};

export const CalendarContext = createContext<CalendarContextType>({
  dataView: null,
  draggingEvent: null,
  setSelectedEvent: () => {},
  selectedEvent: null,
  table: null,
  primaryField: null,
});

export const useCalendarContext = () => {
  return useContext(CalendarContext);
};
