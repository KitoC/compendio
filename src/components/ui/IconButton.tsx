import React from "react";
import { VariantProps, cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const iconButtonVariants = cva(
  "inline-flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-12 w-12",
      },
      rounded: {
        true: "rounded-full",
        false: "rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      rounded: true,
    },
  }
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  isLoading?: boolean;
  icon?: React.ReactNode;
  externalIcon?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      disabled,
      rounded,
      icon,
      externalIcon = false,
      children,
      ...props
    },
    ref
  ) => {
    console.log("icon", icon);
    return (
      <button
        className={cn(
          iconButtonVariants({ variant, size, rounded }),
          className
        )}
        ref={ref}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : externalIcon ? (
          icon
        ) : (
          <span
            className={cn("flex items-center justify-center", {
              "h-4 w-4": size === "sm",
              "h-5 w-5": size === "md",
              "h-6 w-6": size === "lg",
            })}
          >
            {icon}
          </span>
        )}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
