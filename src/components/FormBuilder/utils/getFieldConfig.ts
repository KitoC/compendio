import { FormConfig, FormField } from "../types";

interface GetFieldConfigProps {
  name: string;
  config: FormConfig;
}

/**
 * Recursively finds a field configuration by name in the form config
 * @param name - The name of the field to find
 * @param config - The form configuration to search in
 * @returns The field configuration if found, undefined otherwise
 */
export const getFieldConfig = ({
  name,
  config,
}: GetFieldConfigProps): FormField | undefined => {
  // Helper function to search through fields recursively
  const findFieldInFields = (fields: FormField[]): FormField | undefined => {
    for (const field of fields) {
      // Check if this is the field we're looking for
      if (field.name === name) {
        return field;
      }

      // If this is a field group, recursively search its fields
      if (field.type === "field-group" && field.fields) {
        const foundField = findFieldInFields(field.fields);
        if (foundField) {
          return foundField;
        }
      }
    }
    return undefined;
  };

  // Search through all sections
  for (const section of config.sections) {
    const foundField = findFieldInFields(section.fields);
    if (foundField) {
      return foundField;
    }
  }

  return undefined;
};
