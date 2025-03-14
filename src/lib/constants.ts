
// Route constants to ensure consistency across the application
export const ROUTES = {
  INDEX: "/",
  AUTH: "/auth",
  AUTH_CALLBACK: "/auth/callback",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  CONVERSATIONS: "/conversations",
  CONVERSATION_DETAIL: "/conversation/:id",
  REQUEST_ACCESS: "/request-access",
  ACCESS_PENDING: "/access-pending",
};

// Sidebar configuration
export type SidebarLink = {
  title: string;
  href: string;
  icon?: React.ComponentType;
};

export type SidebarSection = {
  title: string;
  links: SidebarLink[];
};
