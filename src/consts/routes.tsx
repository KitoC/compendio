import { Palette, Link } from "lucide-react";
import Authentication from "@/components/integrations/AddIntegrationWizard/steps/Authentication";
import ConfirmIntegrationSettings from "@/components/integrations/AddIntegrationWizard/steps/ConfirmIntegrationSettings";
import CustomIntegrationSettings from "@/components/integrations/AddIntegrationWizard/steps/CustomIntegrationSettings";
import { IntegrationType } from "@/components/integrations/AddIntegrationWizard/types";

// Auth Routes
export const AUTH_ROUTES = {
  AUTH: "/auth",
  AUTH_CALLBACK: "/auth/callback",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  REQUEST_ACCESS: "/:tenantId/request-access",
  ACCESS_PENDING: "/:tenantId/access-pending",
  BETA_ACCESS: "/beta-access",
};

// Main Application Routes
export const APP_ROUTES = {
  INDEX: "/",
  APPLICATION: "/:tenantId/app",
  DASHBOARD: "/:tenantId/app",
  QUOTES: "/:tenantId/app/quotes",
  QUOTES_NEW: "/:tenantId/app/quotes/new",
  QUOTE: "/:tenantId/app/quotes/:quoteId",
  QUOTE_ITEMS: "items",
  STAFF_MEMBERS: "/:tenantId/app/staff-members",
  CLIENTS: "/:tenantId/app/clients",
  AGENT_CHAT: "/:tenantId/app/assistant-chat/:id",
  TENANT_GUARD: "/:tenantId",
};

// Settings Routes
export const SETTINGS_ROUTES = {
  SETTINGS: "/:tenantId/app/settings",
  SETTINGS_APPEARANCE: "/:tenantId/app/settings/appearance",
  SETTINGS_INTEGRATIONS: "/:tenantId/app/settings/integrations",
  SETTINGS_INTEGRATION_DETAIL: "/:tenantId/app/settings/integrations/:id",
  SETTINGS_WORKFLOW_INSTANCES: "/:tenantId/app/settings/workflow-instances",
  SETTINGS_CUSTOM_ROLES_DETAIL:
    "/:tenantId/app/settings/custom-tables/roles/:id",
  SETTINGS_CUSTOM_ROLES_NEW: "/:tenantId/app/settings/custom-tables/new-role",
};

// Integration Routes
export const INTEGRATION_ROUTES = {
  INTEGRATION_CALLBACK: "/:tenantId/app/integration-callback",
};

// Combine all routes
export const ROUTES = {
  ...AUTH_ROUTES,
  ...APP_ROUTES,
  ...SETTINGS_ROUTES,
  ...INTEGRATION_ROUTES,
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
        label: "Integrations",
        url: ROUTES.SETTINGS_INTEGRATIONS,
        icon: <Link className="h-4 w-4" />,
      },
    ],
  },
];

// Define the supported integration types with their configurations
export const INTEGRATION_TYPES: IntegrationType[] = [
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
];
