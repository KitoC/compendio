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
    functions: ["get_email_integration_options_markup"],
  },
  {
    id: "integration_prompt",
    message:
      "Would you like to connect any services like Gmail, Outlook, or a calendar?",
    type: "multi_select",
    key: "integrations_requested",
    functions: ["get_email_integration_options_markup"],
  },
  {
    id: "final_step",
    message:
      "You're all set, {{name}}! We’ve generated your workspace including tables, agents, workflows, and integrations.",
    type: "info",
    key: "launch_summary",
  },
];
