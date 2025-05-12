import {
  FormConfig,
  FormField,
  FormFieldType,
  FormFieldOption,
} from "@/components/FormBuilder/types";
import { getFieldRenderer } from "../field-renderers";
import CustomTableEntityField from "./EntityField";
import pluralize from "pluralize";
import { SystemSettings } from "@/contexts/SystemSettingsProvider/SystemSettingsContext";
import type {
  CustomTableField,
  CustomTableRecord,
  CustomTableSchema,
} from "@/types/customTable";
import { TimeSettings } from "@/contexts/UserSettingsProvider/UserSettingsContext";
import dayjs from "dayjs";
/**
 * Maps CustomTable field types to FormBuilder field types
 */
export const mapCustomTableTypeToFormFieldType = (
  field: CustomTableField
): FormFieldType => {
  if (field.date_include_time) {
    return "datetime";
  }

  switch (field.type) {
    case "text":
    case "singleLineText":
    case "autoNumber":
    case "barcode":
    case "formula":
    case "lookup":
    case "rollup":
    case "count":
      return "text";
    case "longText":
    case "long_text":
      return "textarea";
    case "number":
    case "duration":
    case "rating":
      return "number";
    case "boolean":
    case "checkbox":
      return "checkbox";
    case "date":
      return "date";
    case "dateTime":
      return "datetime";
    case "createdTime":
    case "last_modified":
    case "created_on":
    case "lastModifiedTime":
      return "date";
    case "email":
      return "email";
    case "single_select":
    case "singleSelect":
      return "select";
    case "multiple_select":
    case "multipleSelects":
      return "multiselect";
    case "url":
      return "text"; // Use text with URL validation
    case "phoneNumber":
    case "phone_number":
      return "text"; // Use text with phone validation
    case "currency":
    case "percent":
      return "number"; // Use number with formatting
    default:
      return "text";
  }
};

/**
 * Convert a CustomTable field to a form field
 */
export const customTableFieldToFormField = (
  field: CustomTableField
): FormField => {
  const fieldType = mapCustomTableTypeToFormFieldType(field);

  const formField: FormField = {
    id: field.id,
    name: field.name,
    label: field.name,
    type: fieldType,
    placeholder: `Enter ${field.name}`,
    disabled: field.is_locked || field.is_computed,
  };

  // Add validation
  formField.validation = {
    required: field.is_primary, // Make primary fields required
  };

  // Add options for select fields
  if (
    [
      "singleSelect",
      "single_select",
      "multiselect",
      "multiple_select",
    ].includes(field.type) &&
    field.options
  ) {
    formField.options = field.options.map(
      (option): FormFieldOption => ({
        label: option.label,
        value: option.value,
        color: option.color,
        variant: "airtable",
      })
    );
  }

  if (
    ["phoneNumber", "phone_number"].includes(field.type) &&
    fieldType === "text"
  ) {
    formField.props = {
      ...(formField.props || {}),
      type: "tel",
    };
  }
  // Add custom props for specific field types
  if (field.type === "currency" && fieldType === "number") {
    formField.props = {
      ...(formField.props || {}),
      isCurrency: true,
      currencySymbol: field.prefix || "$",
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
      maxRating: field.max_value || 5,
    };
  } else if (
    ["multipleAttachments", "attachment", "file"].includes(field.type) &&
    fieldType === "text"
  ) {
    formField.props = {
      ...(formField.props || {}),
      isAttachment: true,
    };
  }

  if (["multipleRecordLinks", "link_row"].includes(field.type)) {
    formField.CustomComponent = (props) => (
      <CustomTableEntityField {...props} value={props.value} field={field} />
    );
  }

  return formField;
};

/**
 * Convert table schema to form config
 */
export const customTableToFormConfig = (
  table: CustomTableSchema,
  record: CustomTableRecord | null,
  isCreating: boolean,
  systemSettings: SystemSettings
): FormConfig => {
  // Convert fields to form fields
  const fields = table.fields
    .filter(
      (field) =>
        !field.is_computed &&
        !field.is_locked &&
        !field.is_readonly &&
        !(systemSettings.consts.READONLY_FIELDS_AIRTABLE as string[]).includes(
          field.type
        )
    )
    .map((field) => customTableFieldToFormField(field));

  const singularTableName = pluralize.singular(table.name);
  const primaryField = table.fields.find(
    (field) => field.id === table.primary_field_id
  );

  const name = record?.[primaryField?.name];
  const editTitle = name ? `${singularTableName} - ${name}` : singularTableName;

  const formConfig: FormConfig = {
    id: `custom-table-form-${table.id}`,
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
  record: CustomTableRecord | null,
  table: CustomTableSchema
): Record<string, unknown> => {
  if (!record) return {};

  const values: Record<string, unknown> = {};

  // Map record fields to form values
  table.fields.forEach((field) => {
    if (record[field.name] !== undefined) {
      values[field.name] = record[field.name];
    }
  });

  return values;
};

/**
 * Format a value for display based on field type
 */
export const formatFieldValue = (
  value: unknown,
  field: CustomTableField,
  record: CustomTableRecord
): React.ReactNode => {
  return getFieldRenderer(field, value, record);
};

export const formatValue = (
  value: unknown,
  field: CustomTableField,
  timeSettings: TimeSettings
): React.ReactNode => {
  if (field.date_format && field.date_include_time) {
    const timeStr = dayjs(value as string)
      .tz(timeSettings.timeZone)
      .format(timeSettings.timeFormat === "12h" ? "h:mm a" : "HH:mm");

    const dateStr = dayjs(value as string)
      .tz(timeSettings.timeZone)
      .format(timeSettings.dateFormat);

    return (
      <span className="text-sm" title={`${dateStr} ${timeStr}`}>
        {dateStr} <span className="text-muted-foreground">{timeStr}</span>
      </span>
    );
  }

  if (field.date_format && !field.date_include_time) {
    return dayjs(value as string)
      .tz(timeSettings.timeZone)
      .format(timeSettings.dateFormat);
  }

  return <>{value as string | number}</>;
};
