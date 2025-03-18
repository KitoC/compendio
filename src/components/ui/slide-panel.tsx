
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
}

export function SlidePanel({
  open,
  onOpenChange,
  title,
  description,
  children,
  className
}: SlidePanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={cn("w-full sm:max-w-md md:max-w-lg", className)}>
        {(title || description) && (
          <SheetHeader className="mb-4">
            {title && <SheetTitle>{title}</SheetTitle>}
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
        )}
        <div className="flex flex-col h-full overflow-auto">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
