
import React from 'react';
import { FieldRendererProps } from './index';

const NumberRenderer = ({ field, value }: FieldRendererProps) => {
  try {
    const numValue = Number(value);
    const precision = field.options?.precision || 0;
    
    // For duration, we may want special formatting
    if (field.type === 'duration') {
      // Simple duration formatting in minutes:seconds
      if (typeof numValue === 'number') {
        const minutes = Math.floor(numValue / 60);
        const seconds = Math.floor(numValue % 60);
        return <span className="text-sm font-mono">{minutes}:{seconds.toString().padStart(2, '0')}</span>;
      }
    }
    
    if (isNaN(numValue)) {
      return <span className="text-sm text-muted-foreground">-</span>;
    }
    
    return <span className="text-sm font-mono tabular-nums">{numValue.toFixed(precision)}</span>;
  } catch (error) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }
};

export default NumberRenderer;
