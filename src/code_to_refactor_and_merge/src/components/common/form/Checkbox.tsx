import React from "react";
import clsx from "clsx";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  className?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="checkbox"
          id={id}
          {...props}
          checked={props.checked || !!props.value}
          className={clsx(
            "h-4 w-4 rounded border-gray-300 text-indigo-600",
            "focus:ring-indigo-500 focus:ring-offset-0",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-red-300",
            className
          )}
        />
        {label && (
          <label
            htmlFor={id}
            className={clsx(
              "text-sm font-medium select-none",
              error ? "text-red-600" : "text-gray-700",
              props.disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {label}
          </label>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
