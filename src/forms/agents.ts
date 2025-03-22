import { FormConfig } from "@/components/form-builder/types";

export const newAgentFormConfig: FormConfig = {
  id: "new-agent-form",
  title: "Create New Agent",
  description: "Configure a new AI agent",
  sections: [
    {
      id: "basic-info",
      title: "Basic Information",
      fields: [
        {
          id: "human_name",
          name: "human_name",
          label: "Display Name",
          type: "text",
          placeholder: "Tech Support Assistant",
          validation: {
            required: true,
          },
        },
        {
          id: "name",
          name: "name",
          label: "Internal Name",
          type: "text",
          placeholder: "tech-support-agent",
          validation: {
            required: true,
            pattern: "^[a-z0-9-]+$",
          },
        },
        {
          id: "responsibility",
          name: "responsibility",
          label: "Responsibility",
          type: "textarea",
          placeholder: "This agent helps with technical support issues...",
          validation: {
            required: true,
          },
        },

        {
          id: "prompt",
          name: "prompt",
          label: "Prompt",
          type: "textarea",
          placeholder: "This agent helps with technical support issues...",
          defaultValue:
            "You are a helpful assistant that can answer questions and help with tasks.",
          validation: {},
        },
        {
          id: "model",
          name: "model",
          label: "AI Model",
          type: "select",
          options: [
            { label: "GPT-4o-mini", value: "gpt-4o-mini" },
            { label: "GPT-4o", value: "gpt-4o" },
            { label: "GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
          ],
          defaultValue: "gpt-4o-mini",
          validation: {
            required: true,
          },
        },
        {
          id: "avatar_url",
          name: "avatar_url",
          label: "Avatar URL",
          type: "text",
          placeholder: "https://example.com/avatar.png",
        },
        {
          id: "enabled",
          name: "enabled",
          label: "Enable Agent",
          type: "checkbox",
          defaultValue: true,
        },
      ],
    },
  ],
  submitButtonText: "Create Agent",
};
