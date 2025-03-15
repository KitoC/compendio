
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { copyToClipboard } from "@/utils/clipboard"
import { useState } from "react"

export function Toaster() {
  const { toasts } = useToast()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleToastClick = async (toast: any) => {
    // Only copy error toasts
    if (toast.variant === 'destructive') {
      const textToCopy = `${toast.title ? toast.title + ': ' : ''}${toast.description || ''}`
      const success = await copyToClipboard(textToCopy);
      
      if (success) {
        setCopiedId(toast.id);
        setTimeout(() => {
          setCopiedId(null);
        }, 2000);
      }
    }
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isError = variant === 'destructive';
        const isCopied = id === copiedId;
        
        return (
          <Toast 
            key={id} 
            variant={variant} 
            {...props}
            onClick={() => isError && handleToastClick({ id, title, description, variant })}
            className={`${isError ? 'cursor-pointer hover:opacity-90' : ''} ${isCopied ? 'ring-2 ring-green-500' : ''}`}
          >
            <div className="grid gap-1">
              {title && (
                <ToastTitle>
                  {title}
                  {isCopied && <span className="ml-2 text-xs text-green-500">(Copied!)</span>}
                </ToastTitle>
              )}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
