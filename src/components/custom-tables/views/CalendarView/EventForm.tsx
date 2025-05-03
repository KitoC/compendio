import FormBuilder from "@/components/form-builder";
import { customTableToFormConfig } from "../../utils";
import { useCalendarContext } from "./CalendarContext";
import { useSystemSettings } from "@/contexts/SystemSettingsProvider";
import { useDataViewContext } from "@/contexts/DataViewProvider";
import { useState } from "react";
import { CustomTableRecord } from "@/types/customTable";

const EventForm = () => {
  const { handleSave } = useDataViewContext();
  const { selectedEvent, setSelectedEvent, table } = useCalendarContext();
  const systemSettings = useSystemSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate form config from table schema
  const defaultConfig = customTableToFormConfig(
    table,
    selectedEvent,
    true,
    systemSettings
  );

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <FormBuilder
        className="border-none rounded-none shadow-none"
        contentClassName="px-4"
        config={{ ...defaultConfig }}
        initialValues={selectedEvent}
        onFormChange={setSelectedEvent}
        isSubmitting={isSubmitting}
        onSubmit={async (editedSelectedEvent: CustomTableRecord) => {
          try {
            setIsSubmitting(true);

            await handleSave(editedSelectedEvent, { optimistic: false });

            setSelectedEvent(null);
            setIsSubmitting(false);
          } catch (error) {
            console.error(error);
            setIsSubmitting(false);
          }
        }}
        onCancel={() => {
          setSelectedEvent(null);
        }}
      />
    </div>
  );
};

export default EventForm;
