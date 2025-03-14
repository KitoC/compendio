import { MessageSquare, User, Settings } from "lucide-react";
import { ReactNode } from "react";

// Route constants to ensure consistency across the application
export const ROUTES = {
  INDEX: "/",
  AUTH: "/auth",
  AUTH_CALLBACK: "/auth/callback",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  CONVERSATIONS: "/app/conversations",
  CONVERSATION_ASSISTANT: "/app/conversations/general-assistant",
  CONVERSATION: "/app/conversations/:id",
  REQUEST_ACCESS: "/app/request-access",
  ACCESS_PENDING: "/app/access-pending",
};

// Sidebar configuration types
export type SidebarItem = {
  label: string;
  url?: string;
  icon?: React.ComponentType;
  children?: SidebarItem[];
};

// Configurable sidebar items
export const sidebarItems: SidebarItem[] = [
  {
    label: "Assistants",
    children: [
      {
        label: "General Assistant",
        url: ROUTES.CONVERSATION_ASSISTANT,
        icon: MessageSquare,
      },
    ],
  },
  {
    label: "Settings",
    children: [
      {
        label: "Profile",
        url: "#",
        icon: User,
      },
      {
        label: "Settings",
        url: "#",
        icon: Settings,
      },
    ],
  },
];
