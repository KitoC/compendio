import React from "react";
import { FieldRendererProps } from "./index";

const NumberRenderer = ({ field, value }: FieldRendererProps) => {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">-</span>;
  }

  // Ensure we're working with a number
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue as number)) {
    return <span className="text-muted-foreground">-</span>;
  }

  // Handle decimal points based on options
  const precision =
    field.options?.precision !== undefined
      ? parseInt(field.options.precision as string, 10)
      : 0;

  const formattedNumber =
    typeof numValue === "number" ? numValue.toFixed(precision) : "-";

  return <span className="block w-full">{formattedNumber}</span>;
};

export default NumberRenderer;
