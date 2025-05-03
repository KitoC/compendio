import { IDataView } from "@/services/DataViewsService";
import { AirtableField, AirtableTable, AirtableRecord } from "@/types/airtable";
import { createContext, useContext } from "react";

interface CalendarEvent {
  id?: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: AirtableRecord;
  resourceId: string;
}

export type CalendarContextType = {
  dataView: IDataView;
  draggingEvent: { event: CalendarEvent } | null;
  setSelectedEvent: (event: AirtableRecord) => void;
  selectedEvent: AirtableRecord | null;
  table: AirtableTable;
  primaryField: AirtableField;
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
