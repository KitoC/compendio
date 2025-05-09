import { CustomFieldComponentProps } from "@/components/form-builder/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCallback, useEffect } from "react";
import { CustomTableField, SelectOption } from "@/types/customTable";
export interface DateFieldValue {
  startDate: string;
  endDate: string;
}

interface DateFieldSelectorProps extends CustomFieldComponentProps {
  dateFields: CustomTableField[];
  value: DateFieldValue;
}

interface SelectorProps {
  onChange: (value: string) => void;
  value: string;
  options: SelectOption[];
  placeholder: string;
  label: string;
}

const Selector = ({
  onChange,
  value,
  options,
  placeholder,
  label,
}: SelectorProps) => {
  return (
    <div className="w-1/2">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <Select value={(value as string) || ""} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options?.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const DateFieldSelector = ({
  onChange,
  value,
  dateFields,
  name,
}: DateFieldSelectorProps) => {
  const dateOptions = dateFields.map((field) => ({
    label: field.name,
    value: field.id,
  }));

  const onChangeHandler = useCallback(
    (key: string, dateValue: string) => {
      onChange(name, { ...(value || {}), [key]: dateValue });
    },
    [onChange, name, value]
  );

  useEffect(() => {
    const startTimeField = dateFields.find((f) =>
      f.name.toLowerCase().match(/start|from/g)
    );
    const endTimeField = dateFields.find((f) =>
      f.name.toLowerCase().match(/end|to/g)
    );

    if (startTimeField && endTimeField && !value) {
      onChange(name, {
        startDate: startTimeField.id,
        endDate: endTimeField.id,
      });
    }
  }, [dateFields, onChange, name, value]);

  return (
    <div className="flex gap-2 w-full">
      <Selector
        label="Start date"
        onChange={(startDate) => onChangeHandler("startDate", startDate)}
        value={value?.startDate || ""}
        options={dateOptions}
        placeholder="Select field"
      />
      <Selector
        label="End date"
        onChange={(endDate) => onChangeHandler("endDate", endDate)}
        value={value?.endDate || ""}
        options={dateOptions}
        placeholder="Select field"
      />
    </div>
  );
};
export default DateFieldSelector;
