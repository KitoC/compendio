import React from "react";
import clsx from "clsx";

export type InputBaseProps = {
  label?: string;
  error?: string;
  className?: string;
};

export type InputProps = InputBaseProps &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof InputBaseProps>;

export type TextAreaProps = InputBaseProps &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, keyof InputBaseProps>;

const baseInputClasses =
  "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500";

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-1 w-full bg-white dark:bg-gray-700 dark:text-white">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        {...props}
        className={clsx(baseInputClasses, error && "border-red-300", className)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
);

Input.displayName = "Input";

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-1 bg-white dark:bg-gray-700 dark:text-white">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        {...props}
        className={clsx(baseInputClasses, error && "border-red-300", className)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
);

TextArea.displayName = "TextArea";
