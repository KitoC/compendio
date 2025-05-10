import Authentication from "@/components/integrations/AddIntegrationWizard/steps/Authentication";
import ConfirmIntegrationSettings from "@/components/integrations/AddIntegrationWizard/steps/ConfirmIntegrationSettings";
import CustomIntegrationSettings from "@/components/integrations/AddIntegrationWizard/steps/CustomIntegrationSettings";
import { IntegrationType } from "@/components/integrations/AddIntegrationWizard/types";
import {
  Palette,
  Users2,
  Table2,
  Workflow,
  Bot,
  Link,
  GitBranch,
  Plus,
} from "lucide-react";

export const ROUTES = {
  INDEX: "/",
  AUTH: "/auth",
  BETA_ACCESS: "/beta-access",
  AUTH_CALLBACK: "/auth/callback",
  APPLICATION: "/:tenantId/app",
  INTEGRATION_CALLBACK: "/:tenantId/app/integration-callback",
  ONBOARDING: "/:tenantId/app/onboarding",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  REQUEST_ACCESS: "/:tenantId/request-access",
  ACCESS_PENDING: "/:tenantId/access-pending",
  TENANT_GUARD: "/:tenantId",
  DASHBOARD: "/:tenantId/app",
  APP: "/app",
  AGENT_CHAT: "/:tenantId/app/assistant-chat/:id",
  CUSTOM_TABLE_DATA: "/:tenantId/app/ct/:id",
  DATA_NAVIGATION: "/:tenantId/app/nav/:dataNavigationPath",
  DATA_NAVIGATION_VIEW: "/:tenantId/app/nav/:dataNavigationPath/:dataViewAlias",
  SETTINGS: "/:tenantId/app/settings",
  SETTINGS_APPEARANCE: "/:tenantId/app/settings/appearance",
  SETTINGS_AGENTS: "/:tenantId/app/settings/agents",
  SETTINGS_AGENTS_DETAIL: "/:tenantId/app/settings/agents/:id",
  SETTINGS_AGENT_WORKFLOWS: "/:tenantId/app/settings/agents/:id/workflows",
  SETTINGS_WORKFLOWS: "/:tenantId/app/settings/workflows",
  SETTINGS_WORKFLOW_DETAIL: "/:tenantId/app/settings/workflows/:id",
  SETTINGS_INTEGRATIONS: "/:tenantId/app/settings/integrations",
  SETTINGS_INTEGRATION_DETAIL: "/:tenantId/app/settings/integrations/:id",
  SETTINGS_WORKFLOW_INSTANCES: "/:tenantId/app/settings/workflow-instances",
  SETTINGS_TABLE_BUILDER: "/:tenantId/app/settings/table-builder",
  SETTINGS_CUSTOM_TABLES: "/:tenantId/app/settings/custom-tables",
  SETTINGS_CUSTOM_TABLES_DETAIL: "/:tenantId/app/settings/custom-tables/:id",
  SETTINGS_CUSTOM_TABLES_NEW: "/:tenantId/app/settings/custom-tables/new-table",
  SETTINGS_CUSTOM_ROLES_DETAIL:
    "/:tenantId/app/settings/custom-tables/roles/:id",
  SETTINGS_CUSTOM_ROLES_NEW: "/:tenantId/app/settings/custom-tables/new-role",
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
export const INTEGRATION_TYPES: IntegrationType[] = [
  // {
  //   id: "airtable",
  //   name: "Airtable",
  //   description: "Connect to Airtable to access your data",
  //   icon: "airtable",
  //   authType: "access_token",
  //   oauthProvider: "airtable",
  //   formConfig: {
  //     id: "airtable-config",
  //     title: "Airtable OAuth Setup",
  //     description: "Click below to authenticate with your Airtable account.",
  //     sections: [],
  //     submitButtonText: "Connect with Airtable",
  //   },
  //   steps: [
  //     Authentication,
  //     // SelectBase,
  //     // SelectTable,
  //     // SelectFields,
  //     // SelectView,
  //     // SelectFields,
  //     // SelectView,
  //   ],
  // },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Connect to Google Drive to access your files",
    icon: "google-drive",
    authType: "oauth",
    oauthProvider: "google",
    requiredScopes: ["https://www.googleapis.com/auth/drive.readonly"],
    formConfig: {
      id: "google-drive-config",
      title: "Google Drive OAuth Setup",
      description: "Click below to authenticate with your Google account.",
      sections: [],
      submitButtonText: "Connect with Google Drive",
    },
    steps: [
      Authentication,
      CustomIntegrationSettings,
      ConfirmIntegrationSettings,
    ],
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Connect to Gmail to access emails and contacts",
    icon: "gmail",
    authType: "oauth",
    oauthProvider: "google",
    formConfig: {
      id: "gmail-config",
      title: "Gmail OAuth Setup",
      description: "Click below to authenticate with your Google account.",
      sections: [],
      submitButtonText: "Connect with Google",
    },
  },
  {
    id: "outlook",
    name: "Outlook",
    description: "Connect to Microsoft Outlook for emails and calendar",
    icon: "outlook",
    authType: "oauth",
    oauthProvider: "azure",
    // TODO: Make this dynamic
    webhookChangeType: "created",
    webhookResource: "me/mailFolders('inbox')/messages",
    formConfig: {
      id: "outlook-config",
      title: "Outlook OAuth Setup",
      description:
        "Authenticate with your Microsoft account to enable Outlook integration.",
      sections: [],
      submitButtonText: "Connect with Microsoft",
    },
  },
  // {
  //   id: "n8n",
  //   name: "N8N",
  //   description: "Connect to N8N workflow automation platform",
  //   icon: "workflow",
  //   authType: "api_key",
  //   formConfig: {
  //     id: "n8n-config",
  //     title: "N8N Configuration",
  //     description: "Enter your N8N instance details",
  //     sections: [
  //       {
  //         id: "connection",
  //         title: "API Connection",
  //         fields: [
  //           {
  //             id: "base_url",
  //             name: "base_url",
  //             label: "Base URL",
  //             type: "text",
  //             placeholder: "https://n8n.example.com",
  //             validation: { required: true },
  //           },
  //           {
  //             id: "api_token",
  //             name: "api_token",
  //             label: "API Token",
  //             type: "password",
  //             validation: { required: true },
  //           },
  //         ],
  //       },
  //     ],
  //     submitButtonText: "Save N8N Connection",
  //   },
  // },
  // {
  //   id: "make",
  //   name: "Make (Integromat)",
  //   description: "Connect to Make automation platform",
  //   icon: "workflow",
  //   authType: "api_key",
  //   formConfig: {
  //     id: "make-config",
  //     title: "Make Configuration",
  //     description: "Enter your Make platform details",
  //     sections: [
  //       {
  //         id: "connection",
  //         title: "API Connection",
  //         fields: [
  //           {
  //             id: "api_token",
  //             name: "api_token",
  //             label: "API Token",
  //             type: "password",
  //             validation: { required: true },
  //           },
  //         ],
  //       },
  //     ],
  //     submitButtonText: "Save Make Connection",
  //   },
  // },
  // {
  //   id: "webhook",
  //   name: "Custom Webhook",
  //   description: "Set up an incoming webhook endpoint",
  //   icon: "webhook",
  //   authType: "custom",
  //   formConfig: {
  //     id: "webhook-config",
  //     title: "Webhook Configuration",
  //     description: "Set up an incoming webhook",
  //     sections: [
  //       {
  //         id: "webhook",
  //         title: "Webhook Info",
  //         fields: [
  //           {
  //             id: "endpoint_url",
  //             name: "endpoint_url",
  //             label: "Webhook URL",
  //             type: "text",
  //             placeholder: "https://your-service.com/webhook",
  //             validation: { required: true },
  //           },
  //           {
  //             id: "secret",
  //             name: "secret",
  //             label: "Webhook Secret",
  //             type: "password",
  //             validation: { required: false },
  //           },
  //         ],
  //       },
  //     ],
  //     submitButtonText: "Save Webhook",
  //   },
  // },
];
