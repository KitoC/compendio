import * as React from "react";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const inputClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";
const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & {
    icon?: React.ReactNode;
    resize?: boolean;
  }
>(({ className, type, icon, resize, ...props }, ref) => {
  const [inputWidth, setInputWidth] = useState(50); // Default width

  // Measure text width on render and update input width
  useEffect(() => {
    const measureTextWidth = () => {
      const text = `${props.value}`;
      const span = document.createElement("span");

      const getOnlyTextClasses = (className: string) => {
        return className
          .split(" ")
          .filter((cls) => cls.includes("text"))
          .join(" ");
      };

      span.className =
        getOnlyTextClasses(inputClassName) +
        " " +
        getOnlyTextClasses(className);
      span.style.visibility = "hidden";
      span.style.whiteSpace = "nowrap";
      span.textContent = text;

      document.body.appendChild(span);
      const nextInputWidth = Math.max(span.offsetWidth, 50);

      setInputWidth(nextInputWidth + 50);
      document.body.removeChild(span);
    };

    if (resize) {
      console.log("resize");
      measureTextWidth();
    }
  }, [props.value, className, resize]);

  console.log("inputWidth", inputWidth);
  return (
    <div className="relative flex items-center w-full">
      {icon && (
        <div className="absolute left-3 flex items-center pointer-events-none">
          {icon}
        </div>
      )}
      <input
        type={type}
        className={cn(inputClassName, icon && "pl-9", className)}
        ref={ref}
        {...props}
        style={{ width: resize ? inputWidth : undefined }}
      />
    </div>
  );
});
Input.displayName = "Input";

export { Input };
