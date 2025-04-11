// NO_CHANGE

import React, { useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface SlidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
  side?: "left" | "right" | "bottom" | "top";
  onOpenAutoFocus?: (e: Event) => void;
  headerContent?: React.ReactNode;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
}

export function SlidePanel({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  footer,
  side,
  onOpenAutoFocus,
  headerContent,
  headerClassName,
  bodyClassName,
  footerClassName,
}: SlidePanelProps) {
  useEffect(() => {
    // IMPORTANT: This is a workaround to prevent the Sheet from not removing the pointer events when the sheet is closed
    if (open) {
      // Pushing the change to the end of the call stack
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = "";
      }, 0);

      return () => clearTimeout(timer);
    } else {
      document.body.style.pointerEvents = "auto";
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={cn(
          "w-full sm:max-w-md md:max-w-3xl flex flex-col p-0 h-[calc(100vh-50px)] gap-0",
          className
        )}
        side={side}
        onOpenAutoFocus={onOpenAutoFocus}
      >
        {(title || description || headerContent) && (
          <SheetHeader className={cn("p-6 border-b", headerClassName)}>
            {title && <SheetTitle>{title}</SheetTitle>}
            {description && <SheetDescription>{description}</SheetDescription>}
            {headerContent && headerContent}
          </SheetHeader>
        )}
        <div className={cn("flex-grow overflow-auto p-6", bodyClassName)}>
          {children}
        </div>
        {footer && (
          <div
            className={cn("border-t p-4 mt-auto", footerClassName)}
            id="slide-panel-footer-portal"
          >
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
