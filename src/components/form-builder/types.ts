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
  | "custom"
  | "datetime"
  | "multiselect"
  | "integer" // Added for custom table fields
  | "boolean" // Added for custom table fields
  | "switch"
  | "conditional"
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (name: string, value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  touched?: boolean;
  formValues: Record<string, unknown>;
  setFormValues: (values: Record<string, unknown>) => void;
}

export interface FormFieldSideEffectParams {
  name: string;
  value: unknown;
  formValues: Record<string, unknown>;
  setFormValues: (values: Record<string, unknown>) => void;
}

export interface FormField {
  id: string | number;
  name: string;
  label?: string;
  type: FormFieldType;
  placeholder?: string;
  defaultValue?: unknown;
  options?: FormFieldOption[];
  validation?: FormFieldValidation;
  validationAsyncOnBlur?: (
    value: unknown
  ) => Promise<{ isValid: boolean; error?: string }>;
  disabled?: boolean;
  className?: string;
  hidden?: boolean | ((values: Record<string, unknown>) => boolean);
  props?: Record<string, unknown>;
  description?: string;
  hint?: string;
  afterLabel?: React.ReactNode;
  onChangeSideEffect?: (params: FormFieldSideEffectParams) => void;
  CustomComponent?: React.ComponentType<CustomFieldComponentProps>;
  renderAfterInput?: (
    value: unknown,
    formValues: Record<string, unknown>
  ) => React.ReactNode;
  renderBelowInput?: (
    value: unknown,
    formValues: Record<string, unknown>
  ) => React.ReactNode;
}

export interface FormSection {
  id: string;
  title?: string;
  description?: string;
  fields: FormField[];
  className?: string;
  divider?: boolean;
  hidden?: boolean | ((values: Record<string, unknown>) => boolean);
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
  onFormChange?: (values: Record<string, unknown>) => void;
  onFormChangeDebounce?: number;
  onSubmitChangeDebounce?: number;
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
  formValues: Record<string, unknown>;
  setFormValues: (values: Record<string, unknown>) => void;
  setError: (name: string, error: string) => void;
}
