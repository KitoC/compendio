import React from "react";
import { ButtonProps } from "./types";
import {
  StyledButton,
  SpinnerIcon,
  IconWrapper,
  getVariantStyles,
} from "./styles";
import clsx from "clsx";

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      className,
      isLoading = false,
      disabled,
      children,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => (
    <StyledButton
      ref={ref}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={isLoading || disabled}
      className={clsx(className, {
        ...getVariantStyles(variant),
      })}
      {...props}
    >
      {isLoading ? (
        <>
          <SpinnerIcon
            size={size}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </SpinnerIcon>
          Loading...
        </>
      ) : (
        <>
          {leftIcon && <IconWrapper size={size}>{leftIcon}</IconWrapper>}
          {children}
          {rightIcon && <IconWrapper size={size}>{rightIcon}</IconWrapper>}
        </>
      )}
    </StyledButton>
  )
);

Button.displayName = "Button";
