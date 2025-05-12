
import React from 'react';
import { FieldRendererProps } from './index';
import { Phone } from 'lucide-react';

const PhoneRenderer = ({ field, value }: FieldRendererProps) => {
  if (!value) return <span className="text-sm text-muted-foreground">-</span>;
  
  const phoneNumber = String(value);
  
  // Simple phone number formatting 
  const formatPhone = (phone: string) => {
    // Remove non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format based on length - this is US-centric, would need to be adjusted for international
    if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
    }
    
    // If we can't format it, return original
    return phone;
  };
  
  const formattedPhone = formatPhone(phoneNumber);
  
  return (
    <a 
      href={`tel:${phoneNumber}`}
      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
    >
      <Phone size={12} />
      {formattedPhone}
    </a>
  );
};

export default PhoneRenderer;
