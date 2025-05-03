import FormBuilder from "@/components/form-builder";
import { customTableToFormConfig } from "../../utils";
import { useCalendarContext } from "./CalendarContext";
import { useSystemSettings } from "@/contexts/SystemSettingsProvider";
import { useDataViewContext } from "@/contexts/DataViewProvider";
import { useCallback, useState } from "react";

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

  const onFormChange = useCallback(
    (values: Record<string, unknown>) => {
      const editedSelectedEvent = {
        ...selectedEvent,
        fields: values,
      };

      setSelectedEvent(editedSelectedEvent);
    },
    [selectedEvent, setSelectedEvent]
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
        onFormChange={onFormChange}
        isSubmitting={isSubmitting}
        onSubmit={async (values) => {
          try {
            const editedSelectedEvent = {
              ...selectedEvent,
              fields: values,
            };

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
