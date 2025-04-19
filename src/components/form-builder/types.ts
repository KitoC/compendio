// NO_CHANGE

export type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "password"
  | "select"
  | "checkbox"
  | "radio"
  | "date"
  | "datetime"
  | "multiselect"
  | "integer" // Added for custom table fields
  | "boolean" // Added for custom table fields
  | "reference" // Added for custom table fields
  | "timestamp" // Added for custom table fields
  | "uuid" // Added for custom table fields
  | "record-select"; // Added for custom table fields

export interface FormFieldOption {
  label: string;
  value: string;
  color?: string;
  variant?: "airtable" | "default";
}

export interface FormFieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  custom?: (value: unknown) => boolean | string;
}

export interface CustomFieldComponentProps {
  id: string;
  name: string;
  type: string;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  touched?: boolean;
}
export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  defaultValue?: unknown;
  options?: FormFieldOption[];
  validation?: FormFieldValidation;
  disabled?: boolean;
  className?: string;
  hidden?: boolean;
  props?: Record<string, unknown>;
  description?: string;
  CustomComponent?: React.ComponentType<CustomFieldComponentProps>;
}

export interface FormSection {
  id: string;
  title?: string;
  description?: string;
  fields: FormField[];
  className?: string;
  divider?: boolean;
}

export interface FormConfig {
  id: string;
  title?: string;
  description?: string;
  sections: FormSection[];
  submitButtonText?: string;
  resetButtonText?: string;
  cancelButtonText?: string;
  showReset?: boolean;
  removeBorder?: boolean;
  resetIconButtonAfter?: React.ReactNode;
  cancelIconButtonAfter?: React.ReactNode;
  cancelIconButtonBefore?: React.ReactNode;
  resetIconButtonBefore?: React.ReactNode;
  submitIconButtonBefore?: React.ReactNode;
  submitIconButtonAfter?: React.ReactNode;
  initialValues?: Record<string, unknown>;
}

export interface FormBuilderProps {
  config: FormConfig;
  onSubmit: (values: Record<string, unknown>) => void;
  initialValues?: Record<string, unknown>;
  isSubmitting?: boolean;
  className?: string;
  buttonPortalId?: string;
  onCancel?: () => void;
  hideSubmitButton?: boolean;
  hideTitles?: boolean;
  footerClassname?: string;
  submitOnChange?: boolean;
  contentClassName?: string;
}

export interface FormFieldProps {
  field: FormField;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  error?: string;
  touched?: boolean;
}
