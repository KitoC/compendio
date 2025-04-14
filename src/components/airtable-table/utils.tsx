import {
  FormConfig,
  FormField,
  FormFieldType,
  FormFieldOption,
} from "@/components/form-builder/types";
import { AirtableField, AirtableTable, AirtableRecord } from "@/types/airtable";
import { getFieldRenderer } from "./field-renderers";
import AirtableEntityField from "./AirtableEntityField";
import pluralize from "pluralize";
import { SystemSettings } from "@/contexts/SystemSettingsProvider/SystemSettingsContext";
/**
 * Maps Airtable field types to FormBuilder field types
 */
export const mapAirtableTypeToFormFieldType = (
  field: AirtableField
): FormFieldType => {
  switch (field.type) {
    case "singleLineText":
    case "autoNumber":
    case "barcode":
    case "formula":
    case "lookup":
    case "rollup":
    case "count":
      return "text";
    case "longText":
      return "textarea";
    case "number":
    case "duration":
    case "rating":
      return "number";
    case "checkbox":
      return "checkbox";
    case "date":
      return "date";
    case "dateTime":
      return "datetime";
    case "createdTime":
    case "lastModifiedTime":
      return "date";
    case "email":
      return "email";
    case "singleSelect":
      return "select";
    case "multipleSelects": // Using multiselect for both types
    case "url":
      return "text"; // Use text with URL validation
    case "phoneNumber":
      return "text"; // Use text with phone validation
    case "currency":
    case "percent":
      return "number"; // Use number with formatting
    default:
      return "text";
  }
};

/**
 * Convert an Airtable field to a form field
 */
export const airtableFieldToFormField = (field: AirtableField): FormField => {
  const fieldType = mapAirtableTypeToFormFieldType(field);

  const formField: FormField = {
    id: field.id,
    name: field.name,
    label: field.name,
    type: fieldType,
    placeholder: `Enter ${field.name}`,
    disabled: field.isLocked || field.isComputed,
  };

  // Add validation
  formField.validation = {
    required: field.isPrimary, // Make primary fields required
  };

  // Add options for select fields
  if (field.type === "singleSelect" && field.options?.choices) {
    formField.options = field.options.choices.map(
      (choice): FormFieldOption => ({
        label: choice.name,
        value: choice.name,
        color: choice.color,
        variant: "airtable",
      })
    );
  }

  // Add custom props for specific field types
  if (field.type === "currency" && fieldType === "number") {
    formField.props = {
      ...(formField.props || {}),
      isCurrency: true,
      currencySymbol: field.options?.symbol || "$",
    };
  } else if (field.type === "percent" && fieldType === "number") {
    formField.props = {
      ...(formField.props || {}),
      isPercent: true,
    };
  } else if (field.type === "rating" && fieldType === "number") {
    formField.props = {
      ...(formField.props || {}),
      isRating: true,
      maxRating: field.options?.max || 5,
    };
  } else if (
    (field.type === "multipleAttachments" || field.type === "attachment") &&
    fieldType === "text"
  ) {
    formField.props = {
      ...(formField.props || {}),
      isAttachment: true,
    };
  }

  if (field.type === "multipleRecordLinks") {
    formField.CustomComponent = (props) => (
      <AirtableEntityField
        {...props}
        value={props.value as string[]}
        field={field}
      />
    );
  }

  return formField;
};

/**
 * Convert table schema to form config
 */
export const airtableTableToFormConfig = (
  table: AirtableTable,
  record: AirtableRecord | null,
  isCreating: boolean,
  systemSettings: SystemSettings
): FormConfig => {
  // Convert fields to form fields
  const fields = table.fields
    .filter(
      (field) =>
        !field.isComputed &&
        !field.isLocked &&
        !(systemSettings.consts.READONLY_FIELDS_AIRTABLE as string[]).includes(
          field.type
        )
    )
    .map((field) => airtableFieldToFormField(field));

  const singularTableName = pluralize.singular(table.name);
  const primaryField = table.fields.find(
    (field) => field.id === table.primaryFieldId
  );

  const name = record?.fields?.[primaryField?.name];
  const editTitle = name ? `${singularTableName} - ${name}` : singularTableName;

  const formConfig: FormConfig = {
    id: `airtable-form-${table.id}`,
    title: isCreating ? `Add New ${singularTableName}` : `Editing ${editTitle}`,
    description: table.description || "",
    sections: [
      {
        id: "main",
        fields,
      },
    ],
    submitButtonText: "Save",
    cancelButtonText: "Cancel",
    showReset: true,
  };

  return formConfig;
};

/**
 * Create initial form values from record
 */
export const createInitialValues = (
  record: AirtableRecord | null,
  table: AirtableTable
): Record<string, unknown> => {
  if (!record) return {};

  const values: Record<string, unknown> = {};

  // Map record fields to form values
  table.fields.forEach((field) => {
    if (record.fields[field.name] !== undefined) {
      values[field.name] = record.fields[field.name];
    }
  });

  return values;
};

/**
 * Format a value for display based on field type
 */
export const formatFieldValue = (
  value: unknown,
  field: AirtableField,
  record: AirtableRecord
): React.ReactNode => {
  return getFieldRenderer(field, value, record);
};
