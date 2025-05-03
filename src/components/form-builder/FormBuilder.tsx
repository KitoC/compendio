// NO_CHANGE

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { FormBuilderProps } from "./types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import FormField from "./FormField";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import isEqual from "lodash/isEqual";
import { Divider } from "@/components/ui/divider";
import validateField from "./utils/validateField";
import { validateForm } from "./utils/validateForm";

const FormBuilder = ({
  config,
  onSubmit,
  initialValues = {},
  isSubmitting = false,
  className,
  buttonPortalId,
  onCancel,
  hideSubmitButton,
  hideTitles = false,
  footerClassname,
  submitOnChange = false,
  contentClassName,
  onFormChange = () => null,
  onFormChangeDebounce = 50,
  onSubmitChangeDebounce = 500,
}: FormBuilderProps) => {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [footerEl, setFooterEl] = useState<HTMLDivElement | null>(null);

  const previousValues = useRef(initialValues);

  const filteredSections = useMemo(
    () =>
      config.sections.filter((section) =>
        typeof section.hidden === "function"
          ? !section?.hidden(values)
          : !section.hidden
      ),
    [config.sections, values]
  );

  const invalidateField = useCallback(
    (name: string, message = "Invalid field") => {
      setErrors((prev) => ({ ...prev, [name]: message }));
    },
    []
  );

  const handleChange = useCallback(
    (name: string, value: unknown) => {
      setValues((prev) => ({ ...prev, [name]: value }));

      // Mark field as touched
      if (!touched[name]) {
        setTouched((prev) => ({ ...prev, [name]: true }));
      }

      // Clear error if it exists
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }

      // Validate field
      const isValid = validateField({ name, value, config, errors, touched });

      if (!isValid) {
        invalidateField(name);
      }
    },
    [config, errors, invalidateField, setErrors, setTouched, setValues, touched]
  );

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();

      if (validateForm({ config, values, errors, touched, filteredSections })) {
        onSubmit(values);
      } else {
        toast.error("Please fix the errors in the form");
      }
    },
    [onSubmit, values, errors, touched, filteredSections, config]
  );

  const handleReset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  useEffect(() => {
    if (!buttonPortalId) return;

    setTimeout(() => {
      const el = document.getElementById(buttonPortalId);
      if (el) {
        setFooterEl(el as HTMLDivElement);
      }
    }, 0);
  }, [values, buttonPortalId]);

  const debouncedHandleSubmit = useDebouncedCallback(
    handleSubmit,
    onSubmitChangeDebounce,
    { leading: false }
  );
  const debouncedHandleFormChange = useDebouncedCallback(
    onFormChange,
    onFormChangeDebounce,
    { leading: false }
  );

  useEffect(() => {
    if (
      submitOnChange &&
      previousValues.current &&
      !isEqual(values, previousValues.current)
    ) {
      debouncedHandleSubmit();
      previousValues.current = values;
    }
  }, [values, debouncedHandleSubmit, submitOnChange]);

  useEffect(() => {
    if (
      onFormChange &&
      previousValues.current &&
      !isEqual(values, previousValues.current)
    ) {
      debouncedHandleFormChange(values);

      previousValues.current = values;
    }
  }, [values, debouncedHandleFormChange, onFormChange]);

  const footer = (
    <CardFooter className={`flex justify-between ${footerClassname}`}>
      {config.showReset && (
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isSubmitting}
        >
          {config.resetIconButtonBefore}
          {config.resetButtonText || "Reset"}
          {config.resetIconButtonAfter}
        </Button>
      )}
      <div className="flex gap-2 ml-auto">
        {(config.cancelButtonText || onCancel) && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {config.cancelIconButtonBefore}
            {config.cancelButtonText || "Cancel"}
            {config.cancelIconButtonAfter}
          </Button>
        )}

        {!hideSubmitButton && (
          <Button
            disabled={isSubmitting}
            className={!config.showReset ? "ml-auto" : ""}
            onClick={handleSubmit}
          >
            {config.submitIconButtonBefore}
            {isSubmitting
              ? "Submitting..."
              : config.submitButtonText || "Submit"}
            {config.submitIconButtonAfter}
          </Button>
        )}
      </div>
    </CardFooter>
  );

  return (
    <Card className={cn("w-full", className)}>
      <form onSubmit={handleSubmit}>
        {(config.title || config.description) && !hideTitles && (
          <CardHeader>
            {config.title && <CardTitle>{config.title}</CardTitle>}
            {config.description && (
              <CardDescription>{config.description}</CardDescription>
            )}
          </CardHeader>
        )}

        <CardContent
          className={cn(
            "space-y-6",
            hideTitles && "pt-6 px-0",
            contentClassName
          )}
        >
          {filteredSections.map((section, index) => (
            <>
              <div
                key={section.id}
                className={cn("space-y-4", section.className || "")}
              >
                {(section.title || section.description) && (
                  <div className="space-y-2">
                    {section.title && (
                      <h3 className="text-lg font-medium">{section.title}</h3>
                    )}
                    {section.description && (
                      <p className="text-sm text-muted-foreground">
                        {section.description}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  {section.fields
                    .filter((field) =>
                      typeof field.hidden === "function"
                        ? !field?.hidden(values)
                        : !field.hidden
                    )
                    .map((field) => (
                      <FormField
                        key={field.id}
                        field={field}
                        value={values[field.name] ?? field.defaultValue ?? ""}
                        onChange={handleChange}
                        error={errors[field.name]}
                        touched={touched[field.name]}
                        formValues={values}
                        setFormValues={setValues}
                      />
                    ))}
                </div>
              </div>
              {section.divider && index !== filteredSections.length - 1 && (
                <Divider />
              )}
            </>
          ))}
        </CardContent>
        {!footerEl && footer}
        {footerEl && createPortal(footer, footerEl)}
      </form>
    </Card>
  );
};

export default FormBuilder;
