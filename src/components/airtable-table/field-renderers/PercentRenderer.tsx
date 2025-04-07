
import React from 'react';
import { FieldRendererProps } from './index';

const PercentRenderer = ({ field, value }: FieldRendererProps) => {
  if (value === null || value === undefined) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }
  
  try {
    const percentage = Number(value);
    
    if (isNaN(percentage)) {
      return <span className="text-sm text-muted-foreground">-</span>;
    }
    
    // Format options
    const precision = field.options?.precision || 1;
    
    // Format the percentage
    const formatter = new Intl.NumberFormat('en-US', { 
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
      style: 'percent',
      // Convert decimal to percentage (1.0 = 100%)
      multiplier: 100
    });
    
    // Handle if the value is already in percentage form
    const valueToFormat = percentage > 1 ? percentage / 100 : percentage;
    const formattedPercentage = formatter.format(valueToFormat);
    
    return (
      <span className="text-sm font-mono tabular-nums">
        {formattedPercentage}
      </span>
    );
  } catch (error) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }
};

export default PercentRenderer;
