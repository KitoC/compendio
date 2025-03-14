import styled, { css, keyframes } from "styled-components";
import { ButtonVariant, ButtonSize } from "./types";
import Color from "color";

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// Shared button styles
export const buttonBaseStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: colors 0.2s;
  border: none;
  width: fit-content;

  &:focus {
    outline: none;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const getVariantStyles = (variant: string) => ({
  // Primary
  "bg-[var(--primary-color,rgb(99_102_241))] text-white hover:enabled:brightness-90":
    variant === "primary",

  // Secondary
  "border border-indigo-500 text-indigo-500 hover:enabled:bg-indigo-50":
    variant === "secondary",

  // Text
  "text-indigo-700 hover:enabled:text-indigo-800 bg-transparent":
    variant === "text",

  // Danger
  "text-red-600 hover:enabled:text-red-700 hover:enabled:bg-red-50 bg-transparent":
    variant === "danger",

  // Ghost
  "text-gray-700 hover:enabled:bg-gray-100 bg-transparent dark:text-gray-300 dark:hover:enabled:bg-gray-700":
    variant === "ghost",

  // Link
  "text-indigo-600 underline hover:enabled:text-indigo-700 bg-transparent":
    variant === "link",
});

// Variant styles

// Size styles
export const buttonSizeStyles = {
  sm: css`
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
  `,
  md: css`
    padding: 0.5rem 1rem;
    font-size: 1rem;
  `,
  lg: css`
    padding: 0.75rem 1.5rem;
    font-size: 1.125rem;
  `,
};

// Icon button specific size styles
export const iconButtonSizeStyles = {
  sm: css`
    height: 2rem;
    width: 2rem;
  `,
  md: css`
    height: 2.5rem;
    width: 2.5rem;
  `,
  lg: css`
    height: 3rem;
    width: 3rem;
  `,
};

// Icon size styles
export const iconSizeStyles = {
  sm: css`
    width: 1rem;
    height: 1rem;
  `,
  md: css`
    width: 1.25rem;
    height: 1.25rem;
  `,
  lg: css`
    width: 1.5rem;
    height: 1.5rem;
  `,
};

// Spinner styles
export const spinnerStyles = css`
  animation: ${spin} 1s linear infinite;
`;

// Base styled components
interface StyledButtonProps {
  variant: ButtonVariant;
  size: ButtonSize;
  fullWidth?: boolean;
}

const primaryCustomizableVariant = css`
  &.primary {
    background-color: ${({ theme }) => theme.chatWidgetTheme?.colors?.primary};
    color: white;
    &:hover:not(:disabled) {
      background-color: ${({ theme }) =>
        Color(theme.chatWidgetTheme?.colors?.primary).darken(0.1).toString()};
    }
  }
`;

export const StyledButton = styled.button<StyledButtonProps>`
  ${buttonBaseStyles}
  ${primaryCustomizableVariant}
  ${(props) => buttonSizeStyles[props.size]}
  ${(props) => props.fullWidth && "width: 100%;"}
  border-radius: 0.375rem;
  display: inline-block;
`;

interface StyledIconButtonProps extends StyledButtonProps {
  rounded?: boolean;
}

export const StyledIconButton = styled.button<StyledIconButtonProps>`
  ${buttonBaseStyles}
  ${primaryCustomizableVariant}
  ${(props) => iconButtonSizeStyles[props.size]}
  border-radius: ${(props) => (props.rounded ? "9999px" : "0.375rem")};
  aspect-ratio: 1;

  &.external-icon {
    font-size: 30px;
  }
`;

export const IconWrapper = styled.span<{ size: ButtonSize }>`
  ${(props) => iconSizeStyles[props.size]}
`;

export const SpinnerIcon = styled.svg<{ size: ButtonSize }>`
  ${spinnerStyles}
  ${(props) => iconSizeStyles[props.size]}
`;
