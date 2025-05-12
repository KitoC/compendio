import { FormConfig, FormSection } from "../types";
import validateField from "./validateField";

interface ValidateFormProps {
  config: FormConfig;
  values: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  filteredSections: FormSection[];
}

export const validateForm = ({
  config,
  values,
  errors,
  touched,
  filteredSections,
}: ValidateFormProps) => {
  const invalidFields: Record<string, string> = {};
  let isValid = true;
  const newTouched: Record<string, boolean> = { ...touched };

  // Validate all fields
  filteredSections.forEach((section) => {
    section.fields.forEach((field) => {
      newTouched[field.name] = true;

      const { isValid: isValidField, errorMessage } = validateField({
        name: field.name,
        value: values[field.name],
        config,
        errors,
        touched,
      });

      if (!isValidField) {
        isValid = false;
        invalidFields[field.name] = errorMessage;
      }
    });
  });

  return { isValid, invalidFields };
};
