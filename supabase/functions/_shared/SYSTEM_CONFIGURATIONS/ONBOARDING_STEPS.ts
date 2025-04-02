export const ONBOARDING_STEPS = [
  {
    id: "welcome_name",
    prompt:
      "Greet the customer and ask for their name. Do so in a polite manner.",
    type: "input",
    key: "name",
    required: true,
  },
  {
    id: "business_intro",
    message:
      "Awesome, thanks {{name}}. In one or two sentences, tell me about your business.",
    type: "textarea",
    key: "business_description",
    required: true,
  },
  {
    id: "confirm_entities",
    prompt:
      "Based on what user shared, generate a summary of the entities they would need.",
    type: "generated_preview",
    key: "initial_summary",
    dataFrom: "business_description",
    required: true,
    showIf: "business_description != null",
  },
  {
    id: "confirm_entities_edit",
    message:
      "You can tweak any of these or add more before we generate your workspace.",
    type: "editable_preview",
    key: "user_confirmed_entities",
    showIf: "initial_summary != null",
  },
  {
    id: "table_preview",
    message:
      "Here’s a preview of the tables we’ll create based on your business.",
    type: "table_preview",
    key: "tables_generated",
    dataFrom: "user_confirmed_entities",
    showIf: "tables_generated.length > 0",
  },
  {
    id: "table_edit",
    message:
      "Would you like to edit or add any fields or tables before we build them?",
    type: "table_editor",
    key: "tables_confirmed",
    showIf: "tables_generated.length > 0",
  },
  {
    id: "workflow_preview",
    message:
      "Based on your needs, here are some workflows that will automate your business tasks.",
    type: "workflow_preview",
    key: "workflows_generated",
    dataFrom: "user_confirmed_entities",
    showIf: "workflows_generated.length > 0",
  },
  {
    id: "workflow_edit",
    message:
      "Would you like to edit or add any automations before we activate them?",
    type: "workflow_editor",
    key: "workflows_confirmed",
    showIf: "workflows_generated.length > 0",
  },
  {
    id: "agent_preview",
    message:
      "Now let’s add assistants to help you manage quotes, jobs, and communication. Here's what I suggest.",
    type: "agent_preview",
    key: "agents_generated",
    dataFrom: "user_confirmed_entities",
    showIf: "agents_generated.length > 0",
  },
  {
    id: "agent_edit",
    message: "You can edit or add more assistants before we finish up.",
    type: "agent_editor",
    key: "agents_confirmed",
    showIf: "agents_generated.length > 0",
  },
  {
    id: "integration_prompt",
    message:
      "Would you like to connect any services like Gmail, Outlook, or a calendar?",
    type: "multi_select",
    key: "integrations_requested",
    options: ["Gmail", "Outlook", "Google Calendar", "Other (N8N/Webhooks)"],
  },
  {
    id: "final_step",
    message:
      "You're all set, {{name}}! We’ve generated your workspace including tables, agents, workflows, and integrations.",
    type: "info",
    key: "launch_summary",
  },
];
