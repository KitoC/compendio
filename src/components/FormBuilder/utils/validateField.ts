import { FormConfig, FormField } from "../types";

interface ValidateFieldProps {
  name: string;
  value: unknown;
  config: FormConfig;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

const validateField = ({
  name,
  value,
  config,
  errors,
  touched,
}: ValidateFieldProps) => {
  // Find the field in the config
  let field: FormField | undefined;

  for (const section of config.sections) {
    const foundField = section.fields.find((f) => f.name === name);
    if (foundField) {
      field = foundField;
      break;
    }
  }

  if (!field || !field.validation) return { isValid: true, errorMessage: "" };

  const validation = field.validation;
  let isValid = true;
  let errorMessage = "";

  // Required validation
  if (
    validation.required &&
    (value === undefined || value === null || value === "")
  ) {
    isValid = false;
    errorMessage = `${field.label} is required`;
  }

  // String validations (for text, textarea, email, password)
  else if (typeof value === "string") {
    // Min length
    if (validation.minLength && value.length < validation.minLength) {
      isValid = false;
      errorMessage = `${field.label} must be at least ${validation.minLength} characters`;
    }
    // Max length
    else if (validation.maxLength && value.length > validation.maxLength) {
      isValid = false;
      errorMessage = `${field.label} must be at most ${validation.maxLength} characters`;
    }
    // Pattern
    else if (
      validation.pattern &&
      !new RegExp(validation.pattern).test(value)
    ) {
      isValid = false;
      errorMessage = `${field.label} is not in a valid format`;
    }
  }

  // Number validations
  else if (typeof value === "number") {
    // Min value
    if (validation.min !== undefined && value < validation.min) {
      isValid = false;
      errorMessage = `${field.label} must be at least ${validation.min}`;
    }
    // Max value
    else if (validation.max !== undefined && value > validation.max) {
      isValid = false;
      errorMessage = `${field.label} must be at most ${validation.max}`;
    }
  }

  // Custom validation
  if (isValid && validation.custom) {
    const customResult = validation.custom(value);
    if (typeof customResult === "string") {
      isValid = false;
      errorMessage = customResult;
    } else if (customResult === false) {
      isValid = false;
      errorMessage = `${field.label} is invalid`;
    }
  }

  //   // Update errors state
  //   if (!isValid) {
  //     setErrors((prev) => ({ ...prev, [name]: errorMessage }));
  //   }

  return { isValid, errorMessage };
};

export default validateField;
