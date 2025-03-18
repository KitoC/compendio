
import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface SlidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}

export function SlidePanel({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  footer
}: SlidePanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={cn("w-full sm:max-w-md md:max-w-lg flex flex-col p-0", className)}>
        {(title || description) && (
          <SheetHeader className="p-6 border-b">
            {title && <SheetTitle>{title}</SheetTitle>}
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
        )}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
        {footer && (
          <div className="border-t p-4 mt-auto">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
