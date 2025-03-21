import { Palette, Users2, Table2 } from "lucide-react";

export const ROUTES = {
  INDEX: "/",
  AUTH: "/auth",
  AUTH_CALLBACK: "/auth/callback",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  REQUEST_ACCESS: "/request-access",
  ACCESS_PENDING: "/access-pending",
  CONVERSATIONS: "/conversations",
  CONVERSATION: "/conversation",
  CONVERSATIONS_DETAIL: "/conversations/:id",
  CUSTOM_TABLE_DATA: "/ct/:id",
  CONVERSATION_ASSISTANT: "/conversations/general-assistant",
  SETTINGS: "/settings",
  SETTINGS_APPEARANCE: "/settings/appearance",
  SETTINGS_AGENTS: "/settings/agents",
  SETTINGS_AGENTS_DETAIL: "/settings/agents/:id",
  SETTINGS_TABLE_BUILDER: "/settings/table-builder",
  SETTINGS_CUSTOM_TABLES: "/settings/custom-tables",
  SETTINGS_CUSTOM_TABLES_DETAIL: "/settings/custom-tables/:id",
  SETTINGS_CUSTOM_TABLES_NEW: "/settings/custom-tables/new-table",
  SETTINGS_CUSTOM_ROLES_DETAIL: "/settings/custom-tables/roles/:id",
  SETTINGS_CUSTOM_ROLES_NEW: "/settings/custom-tables/new-role",
  NOT_FOUND: "*",
};

// Define settings sidebar items
export const settingsItems = [
  {
    label: "Settings",
    children: [
      {
        label: "Appearance",
        url: ROUTES.SETTINGS_APPEARANCE,
        icon: <Palette className="h-4 w-4" />,
      },
      {
        label: "Agents",
        url: ROUTES.SETTINGS_AGENTS,
        icon: <Users2 className="h-4 w-4" />,
      },
      {
        label: "Custom Tables",
        url: ROUTES.SETTINGS_CUSTOM_TABLES,
        icon: <Table2 className="h-4 w-4" />,
      },
      {
        label: "Table Builder",
        url: ROUTES.SETTINGS_TABLE_BUILDER,
        icon: <Table2 className="h-4 w-4" />,
      },
    ],
  },
];
