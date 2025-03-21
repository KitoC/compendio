
import { Home, Inbox, Settings, Users, Database, MessagesSquare, Package, LineChart, Workflow, Wrench } from "lucide-react";

export const ROUTES = {
  HOME: "/",
  CHAT: "/chat",
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  SIGN_UP: "/sign-up",
  SIGN_IN: "/sign-in",
  RESET_PASSWORD: "/reset-password",
  FORGOT_PASSWORD: "/forgot-password",
  REQUEST_ACCESS: "/request-access",
  ACCESS_PENDING: "/access-pending",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  AGENTS: "/settings/agents",
  AGENT_DETAILS: "/settings/agents/:id",
  USERS: "/settings/users",
  INTEGRATIONS: "/settings/integrations",
  CUSTOM_TABLES: "/settings/custom-tables",
  CUSTOM_TABLE_DETAIL: "/settings/custom-tables/:id",
  CUSTOM_TABLE_DATA: "/settings/custom-tables/:id/data",
  TABLE_BUILDER: "/settings/table-builder",
  CONVERSATIONS: "/conversations",
  CONVERSATION_DETAIL: "/conversation/:id",
  CUSTOMERS: "/customers",
  QUOTES: "/quotes",
  JOBS: "/jobs",
  ASSISTANT_CHAT: "/assistant-chat",
};

export const NAVIGATION_CONFIG = [
  {
    title: "Home",
    icon: <Home className="h-4 w-4" />,
    href: ROUTES.HOME,
  },
  {
    title: "Chat",
    icon: <MessagesSquare className="h-4 w-4" />,
    href: ROUTES.ASSISTANT_CHAT,
  },
  {
    title: "Inbox",
    icon: <Inbox className="h-4 w-4" />,
    href: "/inbox",
  },
  {
    title: "Customers",
    icon: <Users className="h-4 w-4" />,
    href: ROUTES.CUSTOMERS,
  },
  {
    title: "Quotes",
    icon: <Package className="h-4 w-4" />,
    href: ROUTES.QUOTES,
  },
  {
    title: "Jobs",
    icon: <Workflow className="h-4 w-4" />,
    href: ROUTES.JOBS,
  },
  {
    title: "Conversations",
    icon: <MessagesSquare className="h-4 w-4" />,
    href: ROUTES.CONVERSATIONS,
  },
  {
    title: "Analytics",
    icon: <LineChart className="h-4 w-4" />,
    href: "/analytics",
  },
  {
    title: "Custom Tables",
    icon: <Database className="h-4 w-4" />,
    href: ROUTES.CUSTOM_TABLES,
  },
  {
    title: "Settings",
    icon: <Settings className="h-4 w-4" />,
    href: ROUTES.SETTINGS,
  },
];

export const SETTINGS_NAVIGATION = [
  {
    title: "Appearance",
    href: `${ROUTES.SETTINGS}/appearance`,
  },
  {
    title: "Agents",
    href: `${ROUTES.SETTINGS}/agents`,
  },
  {
    title: "Custom Tables",
    href: `${ROUTES.SETTINGS}/custom-tables`,
  },
  {
    title: "Table Builder",
    href: `${ROUTES.SETTINGS}/table-builder`,
  },
  {
    title: "Integrations",
    href: `${ROUTES.SETTINGS}/integrations`,
  },
  {
    title: "Users",
    href: `${ROUTES.SETTINGS}/users`,
  },
];
