import { useState, useCallback, useRef, useEffect } from "react";
import { FormConfig, FormField } from "../types";
import { validateForm } from "../utils/validateForm";
import validateField from "../utils/validateField";
import { getFieldConfig } from "../utils/getFieldConfig";
import { useDebouncedCallback } from "use-debounce";
import isEqual from "lodash/isEqual";
import { isEmpty } from "lodash";

interface UseFormStateProps {
  config: FormConfig;
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void;
  onFormChange?: (values: Record<string, unknown>) => void;
  onFormChangeDebounce?: number;
  onSubmitChangeDebounce?: number;
  submitOnChange?: boolean;
}

export const useFormState = ({
  config,
  initialValues = {},
  onSubmit,
  onFormChange,
  onFormChangeDebounce = 50,
  onSubmitChangeDebounce = 500,
  submitOnChange = false,
}: UseFormStateProps) => {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const previousValues = useRef(initialValues);

  const filteredSections = config.sections.filter((section) =>
    typeof section.hidden === "function"
      ? !section?.hidden(values)
      : !section.hidden
  );

  const invalidateField = useCallback(
    (name: string, message = "Invalid field") => {
      setErrors((prev) => ({ ...prev, [name]: message }));
    },
    []
  );

  const handleChange = useCallback(
    (name: string, value: unknown) => {
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

      const field = getFieldConfig({ name, config });
      // Validate field
      const isValid = validateField({ value, field });

      if (!isValid) {
        invalidateField(name);
      }
    },
    [config, errors, invalidateField, touched]
  );

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();

      const { isValid, invalidFields } = validateForm({
        config,
        values,
        errors,
        touched,
        filteredSections,
      });

      setSubmitAttempted(true);

      if (isValid) {
        onSubmit(values);
      } else {
        setErrors(invalidFields);
      }
    },
    [onSubmit, values, errors, touched, filteredSections, config]
  );

  const handleReset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const debouncedHandleSubmit = useDebouncedCallback(
    handleSubmit,
    onSubmitChangeDebounce,
    { leading: false }
  );

  const debouncedHandleFormChange = useDebouncedCallback(
    onFormChange || (() => {}),
    onFormChangeDebounce,
    { leading: false }
  );

  useEffect(() => {
    if (
      submitOnChange &&
      previousValues.current &&
      !isEqual(values, previousValues.current)
    ) {
      debouncedHandleSubmit();
      previousValues.current = values;
    }
  }, [values, debouncedHandleSubmit, submitOnChange]);

  useEffect(() => {
    if (
      onFormChange &&
      previousValues.current &&
      !isEqual(values, previousValues.current)
    ) {
      debouncedHandleFormChange(values);
      previousValues.current = values;
    }
  }, [values, debouncedHandleFormChange, onFormChange]);

  return {
    values,
    setValues,
    errors,
    setErrors,
    touched,
    setTouched,
    submitAttempted,
    filteredSections,
    handleChange,
    handleSubmit,
    handleReset,
    isSubmitting: false, // This should be passed in as a prop
    hasErrors: !isEmpty(errors),
  };
};
