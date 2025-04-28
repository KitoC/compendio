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
  footerId?: string;
  hideOverlay?: boolean;
  onPointerDownOutside?: (e: Event) => void;
  container?: HTMLElement;
  modal?: boolean;
  onCloseAutoFocus?: (e: Event) => void;
  onInteractOutside?: (e: Event) => void;
  onEscapeKeyDown?: (e: KeyboardEvent) => void;
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
  footerId = "slide-panel-footer-portal",
  hideOverlay = false,
  onPointerDownOutside,
  container,
  modal = true,
  onCloseAutoFocus,
  onInteractOutside,
  onEscapeKeyDown,
}: SlidePanelProps) {
  // useEffect(() => {
  //   // IMPORTANT: This is a workaround to prevent the Sheet from not removing the pointer events when the sheet is closed
  //   if (open) {
  //     // Pushing the change to the end of the call stack
  //     const timer = setTimeout(() => {
  //       document.body.style.pointerEvents = "";
  //     }, 0);

  //     return () => clearTimeout(timer);
  //   } else {
  //     document.body.style.pointerEvents = "auto";
  //   }
  // }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={modal}>
      <SheetContent
        container={container}
        className={cn(
          "w-full sm:max-w-md md:max-w-3xl flex flex-col p-0 h-[calc(100vh-50px)] gap-0",
          className
        )}
        side={side}
        onOpenAutoFocus={onOpenAutoFocus}
        hideOverlay={hideOverlay}
        onPointerDownOutside={onPointerDownOutside}
        onCloseAutoFocus={onCloseAutoFocus}
        onInteractOutside={onInteractOutside}
        onEscapeKeyDown={onEscapeKeyDown}
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
            id={footerId}
          >
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
