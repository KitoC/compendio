import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const outlineAndGhost = "bg-transparent  hover:text-muted-foreground";
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: outlineAndGhost,
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: outlineAndGhost,
        link: "text-primary underline-offset-4 hover:underline",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90",
        success: "bg-success text-success-foreground hover:bg-success/90",
        info: "bg-info text-info-foreground hover:bg-info/90",
        danger: "bg-danger text-danger-foreground hover:bg-danger/90",
        muted: "bg-muted text-muted-foreground hover:bg-muted-darker",
        "outline-warning":
          "border border-warning text-warning hover:bg-warning/10",
        "outline-destructive":
          "border border-destructive text-destructive hover:bg-destructive/10",
        "outline-success":
          "border border-success text-success hover:bg-success/10",
        "outline-info": "border border-info text-info hover:bg-info/10",
        "outline-muted": "border border-muted text-muted hover:bg-muted/10",
        "outline-primary":
          "border border-primary text-primary hover:bg-primary/10",
        "outline-secondary":
          "border border-secondary text-secondary hover:bg-secondary/10",
        "outline-ghost": "border border-ghost text-ghost hover:bg-ghost/10",
      },
      size: {
        default: "h-10 px-4 py-2 [&_svg]:size-6",
        xs: "h-8 rounded-md px-3 !gap-1 [&_svg]:size-5",
        sm: "h-9 rounded-md px-3 [&_svg]:size-5",
        lg: "h-11 rounded-md px-8 [&_svg]:size-6",
        icon: "h-10 w-10 [&_svg]:size-5",
        "icon-only": "h-fit w-fit h-fit w-fit !p-0 hover:bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, onClick, type, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
        onClick={(e) => {
          if (
            type !== "submit" &&
            e.target instanceof HTMLElement &&
            e.target.tagName !== "A"
          ) {
            e.preventDefault();
          }
          onClick?.(e);
        }}
        type={type}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
