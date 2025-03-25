// NO_CHANGE

import { FormFieldProps } from "./types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const FormField = ({
  field,
  value,
  onChange,
  error,
  touched,
}: FormFieldProps) => {
  const {
    id,
    name,
    label,
    type,
    placeholder,
    options,
    disabled,
    className,
    props,
  } = field;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    let newValue: string | number | string[] = e.target.value;

    // Convert to number for number inputs
    if (type === "number" && newValue !== "") {
      newValue = Number(newValue);
    }

    onChange(name, newValue);
  };

  const renderField = () => {
    switch (type) {
      case "text":
      case "email":
      case "password":
        return (
          <Input
            id={id}
            name={name}
            type={type}
            value={(value as string) || ""}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              error && touched ? "border-destructive" : "",
              className
            )}
          />
        );

      case "textarea":
        return (
          <Textarea
            id={id}
            name={name}
            value={(value as string) || ""}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              error && touched ? "border-destructive" : "",
              className
            )}
          />
        );

      case "number":
        return (
          <Input
            id={id}
            name={name}
            type="number"
            value={(value as number) || ""}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              error && touched ? "border-destructive" : "",
              className
            )}
          />
        );

      case "select":
        return (
          <Select
            value={(value as string) || ""}
            onValueChange={(val) => onChange(name, val)}
            disabled={disabled}
          >
            <SelectTrigger
              id={id}
              className={cn(
                error && touched ? "border-destructive" : "",
                className
              )}
            >
              <SelectValue placeholder={placeholder || `Select ${label}`} />
            </SelectTrigger>
            <SelectContent>
              {options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={id}
              checked={Boolean(value)}
              onCheckedChange={(checked) => onChange(name, checked)}
              disabled={disabled}
              className={className}
            />
            <label
              htmlFor={id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {label}
            </label>
          </div>
        );

      case "radio":
        return (
          <RadioGroup
            value={(value as string) || ""}
            onValueChange={(val) => onChange(name, val)}
            className={
              props?.orientation === "horizontal"
                ? "flex items-center"
                : "space-y-2"
            }
            {...props}
            orientation={
              (props?.orientation as "horizontal" | "vertical" | undefined) ||
              "vertical"
            }
            disabled={disabled}
          >
            {options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={option.value}
                  id={`${id}-${option.value}`}
                />
                <label
                  htmlFor={`${id}-${option.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </RadioGroup>
        );

      case "date":
        return (
          <Input
            id={id}
            name={name}
            type="date"
            value={(value as string) || ""}
            onChange={handleChange}
            disabled={disabled}
            className={cn(
              error && touched ? "border-destructive" : "",
              className
            )}
          />
        );

      default:
        return <div>Unsupported field type: {type}</div>;
    }
  };

  return (
    <div className="space-y-2">
      {type !== "checkbox" && (
        <Label
          htmlFor={id}
          className={cn(error && touched ? "text-destructive" : "")}
        >
          {label}
        </Label>
      )}
      {renderField()}
      {error && touched && (
        <p className="text-xs font-medium text-destructive">{error}</p>
      )}
    </div>
  );
};

export default FormField;
