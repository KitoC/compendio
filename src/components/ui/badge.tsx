// NO_CHANGE
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "bg-green-200 text-green-800 border-green-300",
        error: "bg-red-200 text-red-800 border-red-300",
        warning: "bg-yellow-200 text-yellow-800 border-yellow-300",
        info: "bg-blue-200 text-blue-800 border-blue-300",
        muted:
          "bg-gray-300 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-700",
        "outline-success": "border-green-200 bg-green-50 text-green-800",
        "outline-primary": "border-primary bg-primary/20 text-primary",
        "outline-error": "border-red-200 bg-red-50 text-red-800",
        "outline-warning": "border-yellow-200 bg-yellow-50 text-yellow-800",
        "outline-info": "border-blue-200 bg-blue-50 text-blue-800",
        "outline-muted": "border-slate-500 bg-slate-200 text-slate-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
