import { FormField } from "../types";
import pluralize from "pluralize";

interface ValidateFieldProps {
  value: unknown;
  field: FormField;
}

const validateField = ({ value, field }: ValidateFieldProps) => {
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
  } else if (Array.isArray(value)) {
    const { minLength, maxLength } = validation;

    if (minLength && value.length < minLength) {
      isValid = false;
      errorMessage = `${
        field.label
      } must have at least ${minLength} ${pluralize("item", minLength)}`;
    }

    if (maxLength && value.length > maxLength) {
      isValid = false;
      errorMessage = `${field.label} must have at most ${maxLength} ${pluralize(
        "item",
        maxLength
      )}`;
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
