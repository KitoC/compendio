import { CustomFieldComponentProps } from "../FormBuilder/types";
import { Views } from "react-big-calendar";
import { DateFieldValue } from "./DateFieldSelector";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { useEffect, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { CustomTableField } from "@/types/customTable";
interface CalendarViewsSelectorProps extends CustomFieldComponentProps {
  dateFields: CustomTableField[];
}

const CalendarViewsSelector = ({
  onChange,
  value,
  name,
  dateFields,
  formValues,
}: CalendarViewsSelectorProps) => {
  const { startDate, endDate } = (formValues["dateFields"] || {
    startDate: "",
    endDate: "",
  }) as DateFieldValue;

  const startDateField = dateFields.find((field) => field.id === startDate);
  const endDateField = dateFields.find((field) => field.id === endDate);

  const hasStartAndEndTime =
    startDateField?.date_include_time && endDateField?.date_include_time;

  const views = useMemo(() => {
    return hasStartAndEndTime
      ? [Views.MONTH, Views.WEEK, Views.WORK_WEEK, Views.DAY, Views.AGENDA]
      : [Views.MONTH, Views.AGENDA];
  }, [hasStartAndEndTime]);

  useEffect(() => {
    if (!value) {
      onChange(name, { views, defaultView: views[0] });
    }
  }, [hasStartAndEndTime, name, onChange, views, value]);

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-col gap-2">
        {views.map((view: string) => (
          <div key={view} className="flex items-center gap-2">
            <Switch
              checked={value?.views?.includes(view)}
              onCheckedChange={(checked) => {
                const newViews = checked
                  ? [...(value?.views || []), view]
                  : value?.views?.filter((v) => v !== view);

                onChange(name, { ...value, views: newViews });
              }}
            />
            <Label>{view.replace("_", " ")}</Label>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 w-1/4">
        <Label className="w-full">Default view</Label>
        <Select
          value={value?.defaultView}
          onValueChange={(defaultView) =>
            onChange(name, { ...value, defaultView })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select default view" />
          </SelectTrigger>
          <SelectContent>
            {views.map((view: string) => (
              <SelectItem key={view} value={view}>
                {view.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default CalendarViewsSelector;
