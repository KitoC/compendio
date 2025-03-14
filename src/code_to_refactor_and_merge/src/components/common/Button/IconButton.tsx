import React from "react";
import { IconButtonProps } from "./types";
import {
  StyledIconButton,
  SpinnerIcon,
  IconWrapper,
  getVariantStyles,
} from "./styles";
import clsx from "clsx";

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = "ghost",
      size = "md",
      className,
      isLoading = false,
      disabled,
      icon,
      title,
      rounded = true,
      externalIcon = false,
      ...props
    },
    ref
  ) => {
    return (
      <StyledIconButton
        ref={ref}
        variant={variant}
        size={size}
        rounded={rounded}
        disabled={isLoading || disabled}
        title={title}
        className={clsx("flex items-center p-0", className, {
          "external-icon": externalIcon,
          ...getVariantStyles(variant),
        })}
        {...props}
      >
        {isLoading ? (
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
        ) : (
          <>
            {externalIcon ? (
              icon
            ) : (
              <IconWrapper size={size}>{icon}</IconWrapper>
            )}
          </>
        )}
      </StyledIconButton>
    );
  }
);

IconButton.displayName = "IconButton";
