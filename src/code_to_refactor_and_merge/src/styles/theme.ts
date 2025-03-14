export const defaultTheme = {
  colors: {
    primary: "#3B82F6", // blue-500
    secondary: "#6B7280", // gray-500
    success: "#10B981", // green-500
    danger: "#EF4444", // red-500
    warning: "#F59E0B", // amber-500
    text: {
      primary: "#111827", // gray-900
      secondary: "#6B7280", // gray-500
    },
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },
  borderRadius: {
    sm: "0.25rem",
    md: "0.5rem",
    lg: "1rem",
    full: "9999px",
  },
  typography: {
    fontSizes: {
      xs: "0.75rem",
      sm: "0.875rem",
      md: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
    },
    fontWeights: {
      normal: 400,
      medium: 500,
      bold: 700,
    },
  },
};

export type Theme = typeof defaultTheme;
