
import React from 'react';
import { FieldRendererProps } from './index';
import { Check } from "lucide-react";

const CheckboxRenderer = ({ field, value }: FieldRendererProps) => {
  const checked = Boolean(value);
  
  return (
    <span className="flex items-center justify-center">
      <span className={`h-5 w-5 rounded border flex items-center justify-center ${checked ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
        {checked && <Check className="h-3.5 w-3.5 text-white" />}
      </span>
    </span>
  );
};

export default CheckboxRenderer;
