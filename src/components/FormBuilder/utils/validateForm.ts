import { FormConfig, FormSection, FormField } from "../types";
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
  console.log({ filteredSections });

  const validateFields = (fields: FormField[]) => {
    fields.forEach((field) => {
      newTouched[field.name] = true;

      // Handle field groups recursively
      if (field.type === "field-group" && field.fields) {
        validateFields(field.fields);
      } else {
        const { isValid: isValidField, errorMessage } = validateField({
          value: values[field.name],
          field,
        });

        if (!isValidField) {
          isValid = false;
          invalidFields[field.name] = errorMessage;
        }
      }
    });
  };

  // Validate all sections
  filteredSections.forEach((section) => {
    validateFields(section.fields);
  });

  console.log({ invalidFields });
  return { isValid, invalidFields };
};
