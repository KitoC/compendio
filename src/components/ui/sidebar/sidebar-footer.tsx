import * as React from "react";
import { cn } from "@/lib/utils";

export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn("flex flex-col gap-1 pb-2", className)}
      {...props}
    />
  );
});
SidebarFooter.displayName = "SidebarFooter";
