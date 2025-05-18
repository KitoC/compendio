// NO_CHANGE

import { useMemo } from "react";
import { createPortal } from "react-dom";
import { FormBuilderProps, FormField as FormFieldConfig } from "./types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import FormField from "./FormField";
import { cn } from "@/lib/utils";
import { Divider } from "@/components/ui/divider";
import { useFormState } from "./hooks/useFormState";
import { FormFooter } from "./components/FormFooter";
import { useRenderPortal } from "@/hooks/useRenderPortal";

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
  const {
    values,
    setValues,
    errors,
    setErrors,
    touched,
    submitAttempted,
    filteredSections,
    handleChange,
    handleSubmit,
    handleReset,
    hasErrors,
  } = useFormState({
    config,
    initialValues,
    onSubmit,
    onFormChange,
    onFormChangeDebounce,
    onSubmitChangeDebounce,
    submitOnChange,
  });

  const menuPortalId = useMemo(() => {
    return `${config.id}-menu-portal`;
  }, [config.id]);

  const renderField = (field: FormFieldConfig) => {
    return (
      <FormField
        key={field.id}
        field={field}
        menuPortalId={menuPortalId}
        value={values[field.name] ?? field.defaultValue ?? ""}
        onChange={handleChange}
        error={errors[field.name]}
        touched={touched[field.name] || submitAttempted}
        formValues={values}
        setFormValues={setValues}
        setError={(name, error) =>
          setErrors((prev) => ({ ...prev, [name]: error }))
        }
      />
    );
  };

  const footer = (
    <FormFooter
      config={config}
      isSubmitting={isSubmitting}
      hasErrors={hasErrors}
      onReset={handleReset}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      hideSubmitButton={hideSubmitButton}
      footerClassname={footerClassname}
    />
  );

  const renderPortal = useRenderPortal(buttonPortalId);

  return (
    <Card className={cn("w-full h-full", className)}>
      <div
        id={menuPortalId}
        className="fixed inset-0 pointer-events-none z-50"
      ></div>
      <form
        onSubmit={handleSubmit}
        className="h-full flex flex-col overflow-y-auto pointer-events-auto"
      >
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
            "space-y-6 flex-grow",
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
                    .map((field) => {
                      if (field.type === "field-group") {
                        return (
                          <div
                            key={field.id}
                            className={cn(
                              "flex flex-row gap-4 w-full flex-wrap xl:flex-nowrap",
                              field.className
                            )}
                          >
                            {field.fields.map(renderField)}
                          </div>
                        );
                      }

                      return renderField(field);
                    })}
                </div>
              </div>
              {section.divider && index !== filteredSections.length - 1 && (
                <Divider />
              )}
            </>
          ))}
        </CardContent>
        {!buttonPortalId && footer}
        {buttonPortalId && renderPortal(footer)}
      </form>
    </Card>
  );
};

export default FormBuilder;
