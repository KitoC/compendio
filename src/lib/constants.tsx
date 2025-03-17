
import { BotIcon, Settings } from "lucide-react";

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
  SETTINGS: "/settings", // Settings page

  // Tenant management
  REQUEST_ACCESS: "/request-access",
  ACCESS_PENDING: "/access-pending",
};

export const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:3001/api`;

// Sidebar navigation configuration
export const sidebarItems = [
  {
    label: "My Agents",
    children: [
      {
        label: "General Assistant",
        url: ROUTES.CONVERSATION_ASSISTANT,
        icon: <BotIcon />,
      },
    ],
  },
  { label: "Settings", url: ROUTES.SETTINGS, icon: <Settings /> },
  // { label: "Dashboard", url: ROUTES.DASHBOARD },
];
