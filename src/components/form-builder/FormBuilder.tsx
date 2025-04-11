// NO_CHANGE

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FormBuilderProps, FormField as FormFieldType } from "./types";
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
}: FormBuilderProps) => {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [footerEl, setFooterEl] = useState<HTMLDivElement | null>(null);

  const handleChange = (name: string, value: unknown) => {
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
    validateField(name, value);
  };

  const validateField = (name: string, value: unknown) => {
    // Find the field in the config
    let field: FormFieldType | undefined;

    for (const section of config.sections) {
      const foundField = section.fields.find((f) => f.name === name);
      if (foundField) {
        field = foundField;
        break;
      }
    }

    if (!field || !field.validation) return true;

    const validation = field.validation;
    let isValid = true;
    let errorMessage = "";

    // Required validation
    if (
      validation.required &&
      (value === undefined || value === null || value === "")
    ) {
      isValid = false;
      errorMessage = `${field.label} is required`;
    }

    // String validations (for text, textarea, email, password)
    else if (typeof value === "string") {
      // Min length
      if (validation.minLength && value.length < validation.minLength) {
        isValid = false;
        errorMessage = `${field.label} must be at least ${validation.minLength} characters`;
      }
      // Max length
      else if (validation.maxLength && value.length > validation.maxLength) {
        isValid = false;
        errorMessage = `${field.label} must be at most ${validation.maxLength} characters`;
      }
      // Pattern
      else if (
        validation.pattern &&
        !new RegExp(validation.pattern).test(value)
      ) {
        isValid = false;
        errorMessage = `${field.label} is not in a valid format`;
      }
    }

    // Number validations
    else if (typeof value === "number") {
      // Min value
      if (validation.min !== undefined && value < validation.min) {
        isValid = false;
        errorMessage = `${field.label} must be at least ${validation.min}`;
      }
      // Max value
      else if (validation.max !== undefined && value > validation.max) {
        isValid = false;
        errorMessage = `${field.label} must be at most ${validation.max}`;
      }
    }

    // Custom validation
    if (isValid && validation.custom) {
      const customResult = validation.custom(value);
      if (typeof customResult === "string") {
        isValid = false;
        errorMessage = customResult;
      } else if (customResult === false) {
        isValid = false;
        errorMessage = `${field.label} is invalid`;
      }
    }

    // Update errors state
    if (!isValid) {
      setErrors((prev) => ({ ...prev, [name]: errorMessage }));
    }

    return isValid;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    const newTouched: Record<string, boolean> = { ...touched };

    // Validate all fields
    config.sections.forEach((section) => {
      section.fields.forEach((field) => {
        newTouched[field.name] = true;

        if (!validateField(field.name, values[field.name])) {
          isValid = false;
          newErrors[field.name] =
            errors[field.name] || `${field.label} is invalid`;
        }
      });
    });

    setTouched(newTouched);
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(values);
    } else {
      toast.error("Please fix the errors in the form");
    }
  };

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

        <CardContent className={cn("space-y-6", hideTitles && "pt-6")}>
          {config.sections.map((section) => (
            <div key={section.id} className="space-y-4">
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
                  .filter((field) => !field.hidden)
                  .map((field) => (
                    <FormField
                      key={field.id}
                      field={field}
                      value={values[field.name] ?? field.defaultValue ?? ""}
                      onChange={handleChange}
                      error={errors[field.name]}
                      touched={touched[field.name]}
                    />
                  ))}
              </div>
            </div>
          ))}
        </CardContent>
        {!footerEl && footer}
        {footerEl && createPortal(footer, footerEl)}
      </form>
    </Card>
  );
};

export default FormBuilder;
