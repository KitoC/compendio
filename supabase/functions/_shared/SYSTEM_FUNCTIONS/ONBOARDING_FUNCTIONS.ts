export const onboarding_progress_update = {
  id: "onboarding_progress_update",
  type: "function",
  name: "onboarding_progress_update",
  description:
    "Update the onboarding state with newly inferred data, such as business description, entities, or completion status.",
  metadata: {
    is_background_task: true,
  },
  parameters: {
    type: "object",
    properties: {
      onboarding_session_id: {
        type: "string",
        description: "The ID of the onboarding session to update.",
      },
      next_step_id: {
        type: "string",
        description: "The ID of the next step to update.",
      },
      updates: {
        type: "object",
        description:
          "Key-value pairs to merge into the user's onboarding state. These are flat keys like 'business_description' or 'uses_email'.",
        additionalProperties: true,
      },
      inferredEntities: {
        type: "object",
        description:
          "Structured definitions of what the user needs, inferred from natural conversation.",
        properties: {
          tables: {
            type: "array",
            items: { type: "string" },
            description:
              "Tables the user needs to track (e.g. 'customers', 'quotes', 'jobs')",
          },
          workflows: {
            type: "array",
            items: { type: "string" },
            description: "Workflow descriptions or IDs",
          },
          triggers: {
            type: "array",
            items: { type: "string" },
            description:
              "Triggers inferred from the user's process (e.g. 'quote_expiring_soon')",
          },
          functions: {
            type: "array",
            items: { type: "string" },
            description: "Inferred functions or automation logic",
          },
          agents: {
            type: "array",
            items: { type: "string" },
            description: "AI agents to create (e.g. 'Quote Assistant')",
          },
          integrations: {
            type: "array",
            items: { type: "string" },
            description:
              "External tools to integrate (e.g. 'Gmail', 'Outlook')",
          },
          views: {
            type: "array",
            items: { type: "string" },
            description:
              "Saved filters or dashboards (e.g. 'pending_quotes', 'overdue_jobs')",
          },
          menu_items: {
            type: "array",
            items: { type: "string" },
            description:
              "Subset of tables that should appear in the main app menu (e.g. 'customers', 'jobs')",
          },
        },
      },
      done: {
        type: "boolean",
        description:
          "Set to true if onboarding is complete and ready to generate the workspace.",
      },
    },
    required: [
      "updates",
      "next_step_id",
      "inferredEntities",
      "onboarding_session_id",
    ],
  },
};

export const get_email_integration_markup_schema = {
  id: "get_email_integration_markup",
  type: "options",
  name: "get_email_integration_markup",
  description: "Get the markup for the email integration.",
  parameters: {
    type: "object",
    properties: {
      onboarding_session_id: {
        type: "string",
        description: "The ID of the onboarding session to update.",
      },
    },
    required: ["onboarding_session_id"],
  },
  metadata: {
    is_background_task: true,
  },
  markup: {
    options: [
      {
        label: "Gmail",
        value: "gmail",
      },
      {
        label: "Outlook",
        value: "outlook",
      },
    ],
  },
};
