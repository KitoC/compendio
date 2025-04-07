
import React from 'react';
import { FieldRendererProps } from './index';
import { ExternalLink } from 'lucide-react';

const UrlRenderer = ({ field, value }: FieldRendererProps) => {
  if (!value) return <span className="text-sm text-muted-foreground">-</span>;
  
  const url = String(value);
  let displayUrl = url;
  
  // Truncate URL for display
  try {
    const urlObj = new URL(url);
    displayUrl = urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '');
    if (displayUrl.length > 30) {
      displayUrl = displayUrl.substring(0, 27) + '...';
    }
  } catch (error) {
    // If URL parsing fails, just use the truncated string
    if (url.length > 30) {
      displayUrl = url.substring(0, 27) + '...';
    }
  }
  
  return (
    <a 
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
    >
      {displayUrl}
      <ExternalLink size={12} />
    </a>
  );
};

export default UrlRenderer;
