
import React from 'react';
import { FieldRendererProps } from './index';
import { Paperclip, FileText, Image, FileArchive, File } from 'lucide-react';

interface Attachment {
  id: string;
  url: string;
  filename: string;
  size?: number;
  type?: string;
  thumbnails?: {
    small?: { url: string };
    large?: { url: string };
  };
}

const AttachmentRenderer = ({ field, value }: FieldRendererProps) => {
  if (!value || !Array.isArray(value) || value.length === 0) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }
  
  const attachments = value as Attachment[];

  // Get the appropriate icon based on file type
  const getFileIcon = (attachment: Attachment) => {
    const type = attachment.type?.toLowerCase() || '';
    
    if (type.includes('image')) {
      return <Image className="h-4 w-4" />;
    } else if (type.includes('pdf') || type.includes('text') || type.includes('doc')) {
      return <FileText className="h-4 w-4" />;
    } else if (type.includes('zip') || type.includes('compressed')) {
      return <FileArchive className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };
  
  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${Math.round(kb)} KB`;
    }
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-1">
      {attachments.map((attachment, index) => (
        <a
          key={attachment.id || index}
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          {getFileIcon(attachment)}
          <span className="truncate max-w-[150px]">{attachment.filename}</span>
          {attachment.size && (
            <span className="text-muted-foreground">({formatFileSize(attachment.size)})</span>
          )}
        </a>
      ))}
      {attachments.length > 1 && (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Paperclip className="h-3 w-3" /> {attachments.length} files
        </span>
      )}
    </div>
  );
};

export default AttachmentRenderer;
