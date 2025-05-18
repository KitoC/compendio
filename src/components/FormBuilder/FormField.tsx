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
import { Star, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCustomTableColor } from "@/utils/customTableHelpers";
import Multiselect, { MultiselectOption } from "@/components/ui/multiselect";
import { CalendarInput } from "../ui/calendar-input";
import { Switch } from "../ui/switch";
import {
  HTMLInputTypeAttribute,
  useCallback,
  useState,
  useEffect,
} from "react";
import { SelectOption } from "@/types/fieldTypes";

const FormField = ({
  field,
  value,
  onChange,
  error,
  touched,
  formValues,
  setFormValues,
  setError,
  menuPortalId,
}: FormFieldProps) => {
  const {
    name,
    label,
    description,
    type,
    placeholder,
    options,
    disabled,
    className,
    props,
    afterLabel,
    hint,
    onChangeSideEffect,
    CustomComponent,
    renderAfterInput,
    renderBelowInput,
    validationAsyncOnBlur,
    wrapperClassName,
  } = field;

  const [menuPortalTarget, setMenuPortalTarget] = useState<HTMLElement | null>(
    null
  );

  const id = field.id as string;
  let optionValue: SelectOption<unknown> | undefined;
  const handleChangeSideEffect = useCallback(
    (newFormValues: Record<string, unknown>) => {
      onChangeSideEffect?.({
        name,
        value,
        formValues: newFormValues,
        setFormValues,
      });
    },
    [onChangeSideEffect, name, value, setFormValues]
  );

  const handleChange = useCallback(
    (
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
      handleChangeSideEffect({ ...formValues, [name]: newValue });

      // Mark field as touched
      if (!touched) {
        // This is handled in FormBuilder
      }

      // Clear error if it exists
      if (error) {
        // This is handled in FormBuilder
      }
    },
    [error, touched, onChange, name, type, handleChangeSideEffect, formValues]
  );

  const onFieldChange = useCallback(
    (fieldValue: unknown) => {
      onChange(name, fieldValue);
      handleChangeSideEffect({ ...formValues, [name]: fieldValue });
    },
    [onChange, name, handleChangeSideEffect, formValues]
  );

  const onFieldBlur = useCallback(
    async (fieldValue: unknown) => {
      if (validationAsyncOnBlur) {
        const { isValid, error } = await validationAsyncOnBlur(fieldValue);

        if (!isValid) {
          setError(name, error || "Invalid value");
        }
      }
    },
    [validationAsyncOnBlur, name, setError]
  );

  // Format currency value for display
  const formatCurrency = (value: number | string): string => {
    if (value === undefined || value === null || value === "") return "";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    const symbol = props?.currencySymbol || "$";
    return isNaN(numValue) ? "" : `${symbol}${numValue.toFixed(2)}`;
  };

  // Format percent value for display
  const formatPercent = (value: number | string): string => {
    if (value === undefined || value === null || value === "") return "";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return isNaN(numValue) ? "" : `${numValue.toFixed(2)}%`;
  };

  // Render a rating component
  const renderRating = () => {
    const maxRating = props?.maxRating || 5;
    const currentRating = Number(value) || 0;

    return (
      <div className="flex items-center gap-1">
        {[...Array(maxRating)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-5 w-5 cursor-pointer",
              i < currentRating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            )}
            onClick={() => onFieldChange(i + 1)}
          />
        ))}
      </div>
    );
  };

  // Render attachment input
  const renderAttachmentInput = () => {
    return (
      <Input
        id={id}
        name={name}
        type="file"
        onChange={(e) => {
          // Handle file uploads - simplified for now
          const files = e.target.files;
          if (files && files.length > 0) {
            onFieldChange(files);
          }
        }}
        disabled={disabled}
        className={cn(error && touched ? "border-destructive" : "", className)}
        multiple={true}
      />
    );
  };

  useEffect(() => {
    setTimeout(() => {
      setMenuPortalTarget(document.getElementById(menuPortalId || ""));
    }, 100);
  }, []);

  const renderField = () => {
    // Handle special Airtable field types with custom rendering
    if (props?.isRating) {
      return renderRating();
    }

    if (props?.isAttachment) {
      return renderAttachmentInput();
    }

    if (CustomComponent) {
      return (
        <CustomComponent
          id={id}
          name={name}
          type={type}
          value={(value as string) || ""}
          onChange={(name, value) => onFieldChange(value)}
          placeholder={placeholder}
          disabled={disabled}
          error={error}
          touched={touched}
          formValues={formValues}
          setFormValues={setFormValues}
          {...props}
        />
      );
    }

    switch (type) {
      case "text":
      case "email":
      case "password":
        return (
          <Input
            id={id}
            name={name}
            type={(props?.type as HTMLInputTypeAttribute) || type}
            value={(value as string) || ""}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            onBlur={() => onFieldBlur(value)}
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
        // Handle currency and percent special cases
        if (props?.isCurrency) {
          return (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {(props?.currencySymbol as string) || "$"}
              </span>
              <Input
                id={id}
                name={name}
                type="number"
                step="0.01"
                value={(value as number) || ""}
                onChange={handleChange}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                  "pl-7",
                  error && touched ? "border-destructive" : "",
                  className
                )}
              />
            </div>
          );
        }

        if (props?.isPercent) {
          return (
            <div className="relative">
              <Input
                id={id}
                name={name}
                type="number"
                step="0.01"
                value={(value as number) || ""}
                onChange={handleChange}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                  "pr-7",
                  error && touched ? "border-destructive" : "",
                  className
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                %
              </span>
            </div>
          );
        }

        // Default number input
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
            {...props}
          />
        );

      case "select":
        optionValue = options?.find((option) => option.value === value);

        return (
          <Select
            value={(value as string) || ""}
            onValueChange={onFieldChange}
            disabled={disabled}
          >
            <SelectTrigger
              id={id}
              className={cn(
                error && touched ? "border-destructive" : "",
                className
              )}
            >
              <SelectValue placeholder={placeholder || `Select ${label}`}>
                {optionValue ? (
                  <Badge
                    variant={"outline"}
                    className={cn(
                      "text-xs",
                      getCustomTableColor(optionValue?.color).theme
                    )}
                  >
                    {optionValue?.label}
                  </Badge>
                ) : (
                  value.toString()
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {options?.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.color ? (
                    <Badge
                      variant={option.variant}
                      className={cn(
                        "text-xs",
                        getCustomTableColor(option.color).theme
                      )}
                    >
                      {option.label}
                    </Badge>
                  ) : (
                    option.label
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multiselect":
        return (
          <Multiselect
            name={name}
            disabled={disabled}
            value={value as MultiselectOption[]}
            onChange={onFieldChange}
            options={options as MultiselectOption[]}
            {...field.props}
            menuPortalTarget={menuPortalTarget}
          />
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={id}
              checked={Boolean(value)}
              onCheckedChange={onFieldChange}
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

      case "switch":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={id}
              checked={Boolean(value)}
              onCheckedChange={onFieldChange}
              disabled={disabled}
              className={className}
            />
            <Label
              htmlFor={id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {label}
            </Label>
          </div>
        );

      case "radio":
        return (
          <RadioGroup
            value={(value as string) || ""}
            onValueChange={onFieldChange}
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
                  value={option.value.toString()}
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
        // TODO: replace with Calendar component
        return (
          <Input
            id={id}
            name={name}
            type={"date"}
            value={(value as string) || ""}
            onChange={handleChange}
            disabled={disabled}
            className={cn(
              error && touched ? "border-destructive" : "",
              className
            )}
          />
        );

      case "datetime":
        // TODO: replace with Calendar component
        return (
          <CalendarInput
            id={id}
            name={name}
            value={(value as string) || ""}
            onChange={onFieldChange}
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
    <div className={cn("space-y-2 w-full", wrapperClassName)}>
      {type !== "checkbox" && type !== "switch" && label && (
        <div className="flex items-center gap-2">
          <Label
            htmlFor={id}
            className={cn(error && touched ? "text-destructive" : "")}
          >
            {label}
          </Label>
          {afterLabel && afterLabel}

          {hint && (
            <div title={hint} className="cursor-help">
              <Info className="w-4 h-4" />
            </div>
          )}
        </div>
      )}
      <div className="flex items-center w-full">
        {renderField()}
        {renderAfterInput?.(value, formValues)}
      </div>
      {renderBelowInput?.(value, formValues)}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && touched && (
        <p className="text-xs font-medium text-destructive">{error}</p>
      )}
    </div>
  );
};

export default FormField;
