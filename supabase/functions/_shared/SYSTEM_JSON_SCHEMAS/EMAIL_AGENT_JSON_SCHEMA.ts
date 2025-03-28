export const EMAIL_AGENT_JSON_SCHEMA = {
  name: "email_agent_response",
  schema: {
    type: "object",
    properties: {
      email_drafted: {
        type: ["object", "null"],
        properties: {
          body: { type: "string" },
          to: { type: "string", format: "email" },
        },
        required: ["body", "to"],
      },
      email_id: { type: "string" },
      email_received: {
        type: "object",
        properties: {
          from: { type: "string", format: "email" },
          to: { type: "string", format: "email" },
          subject: { type: "string" },
          latest_message: {
            type: "object",
            properties: {
              body: { type: "string" },
              from: { type: "string", format: "email" },
              timestamp: { type: "string", format: "date-time" },
            },
            required: ["body", "from", "timestamp"],
          },
          thread: {
            type: "array",
            items: {
              type: "object",
              properties: {
                body: { type: "string" },
                from: { type: "string", format: "email" },
                timestamp: { type: "string", format: "date-time" },
              },
              required: ["body", "from", "timestamp"],
            },
          },
        },
        required: ["from", "to", "subject", "latest_message", "thread"],
      },
      email_thread_id: { type: "string" },
      event: {
        type: "string",
        enum: ["email_received", "email_drafted", "both"],
      },
      provider: { type: "string", enum: ["outlook", "gmail"] },
      reasoning: { type: "string" },
    },
    required: [
      "email_id",
      "email_received",
      "email_thread_id",
      "event",
      "provider",
      "reasoning",
    ],
  },
};
