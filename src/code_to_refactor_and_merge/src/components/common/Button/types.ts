import { type ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "text"
  | "danger"
  | "ghost"
  | "link";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export interface IconButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  isLoading?: boolean;
  title?: string;
  icon: ReactNode;
  rounded?: boolean;
  externalIcon?: boolean;
}

export type ButtonProps = ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps>;

export type IconButtonProps = IconButtonBaseProps &
  Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    keyof IconButtonBaseProps
  >;
