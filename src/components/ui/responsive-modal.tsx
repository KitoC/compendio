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
}: {
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
  onOpenAutoFocus?: (e: Event) => void;
}) => {
  const isMobile = useIsMobile();

  if (isMobile || isSlider) {
    return (
      <>
        {Trigger && <Trigger isOpen={isOpen} setIsOpen={setIsOpen} />}

        <SlidePanel
          title={title}
          description={description}
          headerContent={header}
          side={isMobile ? "bottom" : "right"}
          open={isOpen}
          onOpenChange={setIsOpen}
          footer={footer || <></>}
          className={cn(isMobile ? "rounded-t-md" : "h-full", className)}
          headerClassName={headerClassName}
          bodyClassName={bodyClassName}
          footerClassName={footerClassName}
          footerId={footerId}
          onOpenAutoFocus={onOpenAutoFocus}
        >
          {children}
        </SlidePanel>
      </>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
  );
};

export default ResponsiveModal;
