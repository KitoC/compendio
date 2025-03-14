import { User } from "../services/supabase/customers";
import { AppConfigContextType } from "../contexts/appConfig/context";

const emptyUser: Omit<User, "id"> = {
  user_id: "123",
  name: "Barry gilmore",
  email: "kito.clark@gmail.com",
  phone_number: "0412345678",
  address: "123 Main St, Anytown, USA",
};

export const tools = [
  {
    name: "get_current_price_items",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The query to search the current price items by.",
        },
      },
      required: ["query"],
    },
    description: "Gets the current price items from the database.",
  },
  {
    form: {
      prompt:
        "From the provided price items, please extract all DISTINCT materials used for fences.",
      schema: {
        name: "materials",
        schema: {
          type: "object",
          properties: {
            options: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                  },
                  name: {
                    type: "string",
                  },
                  tags: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  imgUrl: {
                    type: "string",
                  },
                  description: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
            },
          },
          additionalProperties: false,
        },
        strict: false,
      },
      formOptions: {
        isMulti: false,
      },
    },
    name: "get_fencing_materials_form",
    parameters: {},
    description: "Gets the fencing materials form.",
  },
  {
    name: "get_contact_details_form",
    parameters: {},
    description: "Gets the contact details form.",
    form: {
      config: {
        fields: [
          {
            name: "name",
            type: "text",
            label: "Name",
            placeholder: "Enter your name",
            value: "{{$json.customerContact.fullName}}",
          },
          {
            name: "email",
            type: "email",
            label: "Email",
            placeholder: "Enter your email",
            value: "{{$json.customerContact.email}}",
          },
          {
            name: "phone_number",
            type: "tel",
            label: "Phone",
            placeholder: "Enter your phone number",
            value: "{{$json.customerContact.phone_number}}",
          },
          {
            name: "address",
            type: "text",
            label: "Address",
            placeholder: "Enter your address",
            value: "{{$json.customerContact.address}}",
          },
          {
            name: "data_storage_confirmation",
            type: "checkbox",
            label: "I agree to storage of my contact details",
            value: true,
          },
        ],
        isSystem: true,
      },
    },
  },
  {
    name: "get_confirmation_form",
    description: "Gets the confirmation form.",
    form: {
      config: {
        isInline: true,
        buttons: [
          { text: "No, details are incorrect" },
          { text: "Yes, details are correct" },
        ],
      },
    },
  },
  {
    name: "get_sub_workflow_initiator_form",
    description: "Sub-workflow initiator form.",
    form: {
      config: {
        isInline: true,
        buttons: [
          { text: "Get a quote for a fence" },
          { text: "I need help with something else" },
        ],
      },
    },
  },
  {
    name: "price_history",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The query to search the price history for.",
        },
      },
    },
    description: "Vector database of price history.",
  },
];

export const buildSystemPrompt = (appConfig: AppConfigContextType): string => {
  const { user = emptyUser, userId, aiAgent } = appConfig;

  if (!aiAgent) {
    throw new Error("No AI agent found");
  }

  const systemPrompt = aiAgent.prompt
    .replace(
      "{{SESSION_DETAILS}}",
      `- **Date and Time:** \`${new Date().toISOString()}\`
- **User ID:** \`${userId}\`
- **Customer Details:**
  - Name: \`${user.name}\` (REQUIRED)
  - Email: \`${user.email}\` (REQUIRED)
  - Phone: \`${user.phone_number}\` (REQUIRED)
  - Address: \`${user.address}\` (REQUIRED)
- **If no details exist, request them first.**`
    )
    .replace(
      "{{TOOLS}}",
      tools.map((tool) => `**${tool.name}:** ${tool.description}`).join("\n")
    )
    .replace("{{AI_NAME}}", aiAgent.human_name || "Gary");

  return systemPrompt;
};

export default buildSystemPrompt;
