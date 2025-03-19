import { Column } from "./types";
import type { FormConfig, FormField, FormFieldType } from "../form-builder";

/**
 * Maps DataTable column types to FormBuilder field types
 */
const mapColumnTypeToFieldType = (
  field: string,
  sample?: unknown
): FormFieldType => {
  if (!sample) return "text";

  const value = sample[field];

  // Determine field type based on the value type
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "checkbox";
  if (value instanceof Date) return "date";

  // Check if field name suggests a specific type
  const fieldLower = field.toLowerCase();
  if (fieldLower.includes("email")) return "email";
  if (fieldLower.includes("password")) return "password";
  if (
    fieldLower.includes("description") ||
    fieldLower.includes("comment") ||
    fieldLower.includes("notes")
  )
    return "textarea";

  // Default to text
  return "text";
};

/**
 * Determines if a field should be included in the form
 */
const shouldIncludeField = (field: string): boolean => {
  // Skip ID fields and created_at/updated_at timestamps as they're usually system-generated
  const excludedFields = [
    "id",
    "created_at",
    "updated_at",
    "createdAt",
    "updatedAt",
  ];
  return !excludedFields.includes(field);
};

/**
 * Converts DataTable columns to a FormBuilder configuration
 */
export const columnsToFormConfig = <T extends Record<string, unknown>>(
  columns: Column<T>[],
  data?: T,
  options?: {
    title?: string;
    description?: string;
    formId?: string;
    includeHiddenColumns?: boolean;
    fieldTypeMap?: Record<string, FormFieldType>;
    submitButtonText?: string;
    showReset?: boolean;
    cancelButtonText?: string;
  }
): FormConfig => {
  const {
    title = "Edit Item",
    description,
    formId = "dynamic-form",
    includeHiddenColumns = false,
    fieldTypeMap = {},
    submitButtonText = "Save",
    cancelButtonText = "Cancel",
    showReset = true,
  } = options || {};

  // Filter columns based on visibility setting
  const visibleColumns = columns.filter(
    (column) => includeHiddenColumns || !column.hidden
  );

  // Create form fields from columns
  const fields: FormField[] = visibleColumns
    .filter((column) => {
      const field = String(column.field);
      return shouldIncludeField(field);
    })
    .map((column) => {
      const field = String(column.field);
      const fieldType =
        fieldTypeMap[field] || mapColumnTypeToFieldType(field, data);

      const formField: FormField = {
        id: `field-${field}`,
        name: field,
        label: column.header,
        type: fieldType,
        placeholder: `Enter ${column.header.toLowerCase()}`,
        validation: {
          required: false, // Default to not required
        },
      };

      // Set default value if data is provided
      if (data && data[field] !== undefined && data[field] !== null) {
        if (fieldType === "date" && data[field] instanceof Date) {
          // Format date as YYYY-MM-DD for date inputs
          const date = data[field] as Date;
          formField.defaultValue = date.toISOString().split("T")[0];
        } else {
          formField.defaultValue = data[field];
        }
      }

      return formField;
    });

  // Create the form configuration
  const formConfig: FormConfig = {
    id: formId,
    title,
    description,
    sections: [
      {
        id: "main-section",
        fields,
      },
    ],
    submitButtonText,
    showReset,
    cancelButtonText,
  };

  return formConfig;
};

/**
 * Creates an initial values object from data for the FormBuilder
 */
export const createInitialValues = <T extends Record<string, unknown>>(
  data: T,
  columns: Column<T>[]
): Record<string, unknown> => {
  const initialValues: Record<string, unknown> = {};

  columns.forEach((column) => {
    const field = String(column.field);
    if (shouldIncludeField(field) && data[field] !== undefined) {
      initialValues[field] = data[field];
    }
  });

  return initialValues;
};
