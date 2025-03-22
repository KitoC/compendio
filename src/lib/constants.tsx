
import { Palette, Users2, Table2, Workflow, Bot, Link, GitBranch, Plus } from "lucide-react";

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
  SETTINGS_AGENT_WORKFLOWS: "/settings/agents/:id/workflows",
  SETTINGS_WORKFLOWS: "/settings/workflows",
  SETTINGS_WORKFLOW_DETAIL: "/settings/workflows/:id",
  SETTINGS_INTEGRATIONS: "/settings/integrations",
  SETTINGS_INTEGRATION_DETAIL: "/settings/integrations/:id",
  SETTINGS_WORKFLOW_INSTANCES: "/settings/workflow-instances",
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
        icon: <Bot className="h-4 w-4" />,
      },
      {
        label: "Workflows",
        url: ROUTES.SETTINGS_WORKFLOWS,
        icon: <Workflow className="h-4 w-4" />,
      },
      {
        label: "Workflow Executions",
        url: ROUTES.SETTINGS_WORKFLOW_INSTANCES,
        icon: <GitBranch className="h-4 w-4" />,
      },
      {
        label: "Integrations",
        url: ROUTES.SETTINGS_INTEGRATIONS,
        icon: <Link className="h-4 w-4" />,
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

// Define the supported integration types with their configurations
export const INTEGRATION_TYPES = [
  {
    id: "gmail",
    name: "Gmail",
    description: "Connect to Gmail to access emails and contacts",
    icon: "mail",
    authType: "oauth",
    oauthProvider: "google",
    formConfig: {
      id: "gmail-config",
      title: "Gmail OAuth Setup",
      description: "Click below to authenticate with your Google account.",
      sections: [],
      submitButtonText: "Connect with Google"
    }
  },
  {
    id: "outlook",
    name: "Outlook",
    description: "Connect to Microsoft Outlook for emails and calendar",
    icon: "mail",
    authType: "oauth",
    oauthProvider: "microsoft",
    formConfig: {
      id: "outlook-config",
      title: "Outlook OAuth Setup",
      description: "Authenticate with your Microsoft account to enable Outlook integration.",
      sections: [],
      submitButtonText: "Connect with Microsoft"
    }
  },
  {
    id: "n8n",
    name: "N8N",
    description: "Connect to N8N workflow automation platform",
    icon: "workflow",
    authType: "api_key",
    formConfig: {
      id: "n8n-config",
      title: "N8N Configuration",
      description: "Enter your N8N instance details",
      sections: [
        {
          id: "connection",
          title: "API Connection",
          fields: [
            {
              id: "base_url",
              name: "base_url",
              label: "Base URL",
              type: "text",
              placeholder: "https://n8n.example.com",
              validation: { required: true }
            },
            {
              id: "api_token",
              name: "api_token",
              label: "API Token",
              type: "password",
              validation: { required: true }
            }
          ]
        }
      ],
      submitButtonText: "Save N8N Connection"
    }
  },
  {
    id: "make",
    name: "Make (Integromat)",
    description: "Connect to Make automation platform",
    icon: "workflow",
    authType: "api_key",
    formConfig: {
      id: "make-config",
      title: "Make Configuration",
      description: "Enter your Make platform details",
      sections: [
        {
          id: "connection",
          title: "API Connection",
          fields: [
            {
              id: "api_token",
              name: "api_token",
              label: "API Token",
              type: "password",
              validation: { required: true }
            }
          ]
        }
      ],
      submitButtonText: "Save Make Connection"
    }
  },
  {
    id: "webhook",
    name: "Custom Webhook",
    description: "Set up an incoming webhook endpoint",
    icon: "webhook",
    authType: "custom",
    formConfig: {
      id: "webhook-config",
      title: "Webhook Configuration",
      description: "Set up an incoming webhook",
      sections: [
        {
          id: "webhook",
          title: "Webhook Info",
          fields: [
            {
              id: "endpoint_url",
              name: "endpoint_url",
              label: "Webhook URL",
              type: "text",
              placeholder: "https://your-service.com/webhook",
              validation: { required: true }
            },
            {
              id: "secret",
              name: "secret",
              label: "Webhook Secret",
              type: "password",
              validation: { required: false }
            }
          ]
        }
      ],
      submitButtonText: "Save Webhook"
    }
  }
];
