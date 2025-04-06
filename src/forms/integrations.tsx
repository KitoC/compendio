import { FormConfig } from "@/components/form-builder/types";
import { ArrowLeft, ArrowRight, LogIn } from "lucide-react";

// OAuth-based integrations
export const gmailFormConfig: FormConfig = {
  id: "gmail-config",
  title: "Gmail OAuth Setup",
  description: "Click below to authenticate with your Google account.",
  sections: [],
  submitButtonText: "Connect with Google",
};

export const outlookFormConfig: FormConfig = {
  id: "outlook-config",
  title: "Outlook OAuth Setup",
  description:
    "Authenticate with your Microsoft account to enable Outlook integration.",
  sections: [
    {
      id: "connection",
      title: "",
      fields: [
        {
          id: "name",
          name: "name",
          label: "Name",
          type: "text",
          validation: { required: true },
        },
      ],
    },
    {
      id: "access",
      title: "Allow access to",
      fields: [
        {
          id: "scope_email",
          name: "scope_email",
          label: "Email",
          type: "radio",
          options: [
            // TODO: Find better way to do this
            { label: "Read", value: "Mail.Read, MailboxSettings.Read" },
            {
              label: "Read and send",
              value: "Mail.ReadWrite, Mail.Send, MailboxSettings.Read",
            },
          ],
          validation: { required: true },
          defaultValue: "Mail.Read, MailboxSettings.Read",
          props: {
            orientation: "horizontal",
          },
        },
        {
          id: "scope_calendar",
          name: "scope_calendar",
          label: "Calendar",
          type: "radio",
          options: [
            // TODO: Find better way to do this
            {
              label: "Read",
              value: "Calendars.Read, Calendars.Read.Shared",
            },
            {
              label: "Read and write",
              value: "Calendars.ReadWrite, Calendars.ReadWrite.Shared",
            },
          ],
          validation: { required: true },
          defaultValue: "Calendars.Read, Calendars.Read.Shared",
          props: {
            orientation: "horizontal",
          },
        },
      ],
    },
  ],
  submitButtonText: "Connect with Microsoft",
  submitIconButtonAfter: <LogIn className="ml-2 h-4 w-4" />,
  initialValues: {
    name: "Outlook",
    scope_email: "Mail.Read, MailboxSettings.Read",
    scope_calendar: "Calendars.Read, Calendars.Read.Shared",
  },
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
          validation: { required: true },
        },
        {
          id: "api_token",
          name: "api_token",
          label: "API Token",
          type: "password",
          validation: { required: true },
        },
      ],
    },
  ],
  submitButtonText: "Save N8N Connection",
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
          validation: { required: true },
        },
        {
          id: "secret",
          name: "secret",
          label: "Webhook Secret",
          type: "password",
          validation: { required: false },
        },
      ],
    },
  ],
  submitButtonText: "Save Webhook",
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
  submitButtonText: "Next",
  cancelButtonText: "Back",
  removeBorder: true,
  cancelIconButtonBefore: <ArrowLeft className="ml-2 h-4 w-4" />,
  submitIconButtonAfter: <ArrowRight className="ml-2 h-4 w-4" />,
};

const airtableFormConfig: FormConfig = {
  id: "airtable-config",
  title: "Airtable Configuration",
  description: "Enter your Airtable instance details",
  sections: [
    {
      id: "settings",
      fields: [
        {
          id: "name",
          name: "name",
          label: "Credential Name",
          type: "text",
          placeholder: "",
          validation: { required: true },
        },
        {
          id: "access_token",
          name: "access_token",
          label: "Access Token",
          type: "password",
          placeholder: "Enter your Airtable access token",
          validation: { required: true },
        },
      ],
    },
  ],
  submitButtonText: "Connect with Airtable",
  initialValues: {
    name: "Airtable personal access token",
    access_token: "",
  },
};

// Map of integrations to their form configs
export const INTEGRATION_FORM_CONFIGS: Record<string, FormConfig> = {
  gmail: gmailFormConfig,
  outlook: outlookFormConfig,
  n8n: n8nFormConfig,
  webhook: webhookFormConfig,
  airtable: airtableFormConfig,
};
