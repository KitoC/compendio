
import React from 'react';
import { FieldRendererProps } from './index';

const DefaultRenderer = ({ field, value }: FieldRendererProps) => {
  // For any unhandled types, try to normalize to string
  try {
    if (typeof value === 'object') {
      return <span className="text-sm truncate">{JSON.stringify(value)}</span>;
    }
    return <span className="text-sm truncate">{String(value)}</span>;
  } catch (error) {
    return <span className="text-sm text-muted-foreground truncate">Invalid value</span>;
  }
};

export default DefaultRenderer;
