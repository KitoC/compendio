import { DialogFooter, DialogTitle } from "./dialog";
import { DialogTrigger } from "./dialog";
import { SlidePanel } from "./slide-panel";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DialogContent,
  DialogHeader,
  Dialog,
  DialogDescription,
} from "./dialog";
import { cn } from "@/lib/utils";

type ResponsiveModalProps = {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  Trigger?: React.ComponentType<{
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
  }>;
  isSlider?: boolean;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  title?: string;
  description?: string;
  footerId?: string;
  hideOverlay?: boolean;
  onOpenAutoFocus?: (e: Event) => void;
  onCloseAutoFocus?: (e: Event) => void;
  onPointerDownOutside?: (e: Event) => void;
  onInteractOutside?: (e: Event) => void;
  onEscapeKeyDown?: (e: KeyboardEvent) => void;
  container?: HTMLElement;
  modal?: boolean;
};

const ResponsiveModal = ({
  children,
  header,
  footer,
  Trigger,
  isSlider = false,
  className,
  headerClassName,
  footerClassName,
  bodyClassName,
  isOpen = false,
  setIsOpen,
  title,
  description,
  footerId,
  onOpenAutoFocus = (e) => {
    e.preventDefault();
  },
  hideOverlay = false,
  onPointerDownOutside,
  container,
  modal = true,
  onCloseAutoFocus,
  onInteractOutside,
  onEscapeKeyDown,
}: ResponsiveModalProps) => {
  const isMobile = useIsMobile();

  if (isMobile || isSlider) {
    return (
      <>
        {Trigger && <Trigger isOpen={isOpen} setIsOpen={setIsOpen} />}

        <SlidePanel
          hideOverlay={hideOverlay}
          title={title}
          description={description}
          headerContent={header}
          side={isMobile ? "bottom" : "right"}
          open={isOpen}
          onOpenChange={(nextIsOpen, ...rest) => {
            console.log("onOpenChange", nextIsOpen, rest);
            setIsOpen(nextIsOpen);

            if (!nextIsOpen) {
              onOpenAutoFocus(new Event("focus"));
            }
          }}
          footer={footer || null}
          className={cn(isMobile ? "rounded-t-md" : "h-full", className)}
          headerClassName={cn(headerClassName, "shadow-sm z-10")}
          bodyClassName={bodyClassName}
          footerClassName={footerClassName}
          footerId={footerId}
          onOpenAutoFocus={onOpenAutoFocus}
          onPointerDownOutside={onPointerDownOutside}
          container={container}
          modal={modal}
          onCloseAutoFocus={onCloseAutoFocus}
          onInteractOutside={onInteractOutside}
          onEscapeKeyDown={onEscapeKeyDown}
        >
          {children}
        </SlidePanel>
      </>
    );
  }

  return (
    <div
      onKeyDown={(e) => {
        e.stopPropagation();
      }}
      onKeyDownCapture={(e) => {
        e.stopPropagation();
      }}
    >
      <Dialog open={isOpen} onOpenChange={setIsOpen} modal={modal}>
        {Trigger && (
          <DialogTrigger asChild>
            <Trigger isOpen={isOpen} setIsOpen={setIsOpen} />
          </DialogTrigger>
        )}
        <DialogContent
          className={cn(
            "p-4 border-0 max-w-3xl h-[80vh] bg-background",
            className
          )}
          onOpenAutoFocus={onOpenAutoFocus}
          hideOverlay={hideOverlay}
          onPointerDownOutside={onPointerDownOutside}
          onCloseAutoFocus={onCloseAutoFocus}
          onInteractOutside={onInteractOutside}
          onEscapeKeyDown={onEscapeKeyDown}
        >
          {header && (
            <DialogHeader className={headerClassName}>
              {title && <DialogTitle>{title}</DialogTitle>}
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
              {header}
            </DialogHeader>
          )}
          <div className={cn("flex-1 overflow-auto p-6", bodyClassName)}>
            {children}
          </div>

          {footer && (
            <DialogFooter className={footerClassName}>{footer}</DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResponsiveModal;
