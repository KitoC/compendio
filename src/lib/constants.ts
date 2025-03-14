
export const ROUTES = {
  // Public routes
  INDEX: "/",
  AUTH: "/auth",
  AUTH_CALLBACK: "/auth/callback",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  
  // Protected routes
  DASHBOARD: "/dashboard",
  CONVERSATIONS: "/conversations",
  CONVERSATION: "/conversation", // Base path, will be followed by an ID or alias
  CONVERSATION_ASSISTANT: "/conversation/general-assistant", // Predefined alias for assistant chat
  
  // Tenant management
  REQUEST_ACCESS: "/request-access",
  ACCESS_PENDING: "/access-pending",
};

export const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:3001/api`;

// Sidebar navigation configuration
export const sidebarItems = [
  {
    label: "Conversations",
    children: [
      { label: "All Conversations", url: ROUTES.CONVERSATIONS },
      { label: "Assistant Chat", url: ROUTES.CONVERSATION_ASSISTANT }
    ],
  },
  { label: "Dashboard", url: ROUTES.DASHBOARD },
];
