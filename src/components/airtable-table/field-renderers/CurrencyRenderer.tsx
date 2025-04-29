
import React from "react";
import { FieldRendererProps } from "./index";

const CurrencyRenderer = ({ field, value }: FieldRendererProps) => {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">-</span>;
  }

  // Ensure we're working with a number
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return <span className="text-muted-foreground">-</span>;
  }

  // Default symbol is $
  const symbol = field.options?.symbol || "$";
  
  // Format as currency with 2 decimal places
  const formattedValue = typeof numValue === 'number' 
    ? new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD', // Default to USD
        currencyDisplay: 'symbol',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(numValue)
    : '-';
    
  // Replace the default $ with the field's symbol if different
  const displayValue = formattedValue.replace(/^\$/, symbol);

  return <span className="block w-full">{displayValue}</span>;
};

export default CurrencyRenderer;
