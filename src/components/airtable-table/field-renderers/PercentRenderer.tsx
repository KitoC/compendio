
import React from "react";
import { FieldRendererProps } from "./index";

const PercentRenderer = ({ field, value }: FieldRendererProps) => {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">-</span>;
  }

  // Ensure we're working with a number
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return <span className="text-muted-foreground">-</span>;
  }

  // Format as percentage with 2 decimal places by default
  const formattedValue = typeof numValue === 'number' 
    ? new Intl.NumberFormat(undefined, {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(numValue / 100) // Divide by 100 as percentage values are typically stored as regular numbers
    : '-';

  return <span>{formattedValue}</span>;
};

export default PercentRenderer;
