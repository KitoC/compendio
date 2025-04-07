
import React from 'react';
import { FieldRendererProps } from './index';

const CurrencyRenderer = ({ field, value }: FieldRendererProps) => {
  if (value === null || value === undefined) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }
  
  try {
    const amount = Number(value);
    
    if (isNaN(amount)) {
      return <span className="text-sm text-muted-foreground">-</span>;
    }
    
    // Format options
    const precision = field.options?.precision || 2;
    const currencySymbol = '$'; // Could be configurable based on field options
    
    // Format the currency
    const formatter = new Intl.NumberFormat('en-US', { 
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    });
    
    const formattedAmount = formatter.format(amount);
    
    return (
      <span className="text-sm font-mono tabular-nums">
        {currencySymbol}{formattedAmount}
      </span>
    );
  } catch (error) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }
};

export default CurrencyRenderer;
