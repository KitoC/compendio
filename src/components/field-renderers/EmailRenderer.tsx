
import React from 'react';
import { FieldRendererProps } from './index';
import { Mail } from 'lucide-react';

const EmailRenderer = ({ field, value }: FieldRendererProps) => {
  if (!value) return <span className="text-sm text-muted-foreground">-</span>;
  
  const email = String(value);
  
  return (
    <a 
      href={`mailto:${email}`}
      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
    >
      <Mail size={12} />
      {email}
    </a>
  );
};

export default EmailRenderer;
