
import { FormConfig } from "@/components/form-builder/types";

// OAuth-based integrations
export const gmailFormConfig: FormConfig = {
  id: "gmail-config",
  title: "Gmail OAuth Setup",
  description: "Click below to authenticate with your Google account.",
  sections: [],
  submitButtonText: "Connect with Google"
};

export const outlookFormConfig: FormConfig = {
  id: "outlook-config",
  title: "Outlook OAuth Setup",
  description: "Authenticate with your Microsoft account to enable Outlook integration.",
  sections: [],
  submitButtonText: "Connect with Microsoft"
};

// API Key / Custom integrations
export const n8nFormConfig: FormConfig = {
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
};

export const webhookFormConfig: FormConfig = {
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
};

// Integration settings form
export const integrationSettingsConfig: FormConfig = {
  id: "integration-settings",
  title: "Integration Settings",
  sections: [
    {
      id: "settings",
      fields: [
        {
          id: "name",
          name: "name",
          label: "Integration Name",
          type: "text",
          placeholder: "My Integration",
        },
        {
          id: "description",
          name: "description",
          label: "Description",
          type: "textarea",
          placeholder: "What will this integration be used for?",
        },
      ],
    },
  ],
  submitButtonText: "Continue",
};

// Map of integrations to their form configs
export const INTEGRATION_FORM_CONFIGS: Record<string, FormConfig> = {
  gmail: gmailFormConfig,
  outlook: outlookFormConfig,
  n8n: n8nFormConfig,
  webhook: webhookFormConfig,
};
