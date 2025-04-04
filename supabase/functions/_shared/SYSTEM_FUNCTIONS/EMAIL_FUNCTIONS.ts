export const send_email = {
  name: "send_email",
  type: "function",
  description: "Used for sending emails from the draft responses in compendio.",
  config: {},
  schema: {},
  parameters: {
    type: "object",
    required: ["conversation_id"],
    properties: {
      message_id: {
        type: "string",
        description: "Id of the message that the email draft belongs to",
      },
      conversation_id: {
        type: "string",
        description:
          "Id of the conversation the email draft message belongs to",
      },
    },
  },
  enabled_for: [],
  id: "SYSTEM_EMAIL_SEND",
  deleted_at: null,
  tenant_id: "system",
  markup: {},
};
