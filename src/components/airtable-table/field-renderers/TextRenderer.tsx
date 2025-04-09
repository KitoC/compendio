
import React from 'react';
import { FieldRendererProps } from './index';

const TextRenderer = ({ field, value }: FieldRendererProps) => {
  // Handle long text with ellipsis
  const text = String(value);
  const maxLength = 100;
  
  if (field.type === 'longText' && text.length > maxLength) {
    return (
      <span className="text-sm truncate" title={text}>
        {text.substring(0, maxLength)}...
      </span>
    );
  }
  
  return <span className="text-sm truncate" title={text}>{text}</span>;
};

export default TextRenderer;
