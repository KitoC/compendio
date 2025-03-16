import type SupabaseService from "../shared/services/SupabaseService";
import type { IFunction, IFunctionCall } from "../../../src/types/aiAgents";

const mockFunctions: IFunction[] = [
  {
    name: "get_current_price_items",
    parameters: {},
    description: "Gets the current price items from the database.",
    type: "retrieval",
  },
  {
    markup: {
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
    type: "form",
  },
  {
    markup: {
      config: {
        fields: [
          {
            name: "name",
            type: "text",
            label: "Name",
            value: "{{$json.customerContact.fullName}}",
            placeholder: "Enter your name",
          },
          {
            name: "email",
            type: "email",
            label: "Email",
            value: "{{$json.customerContact.email}}",
            placeholder: "Enter your email",
          },
          {
            name: "phone_number",
            type: "tel",
            label: "Phone",
            value: "{{$json.customerContact.phone_number}}",
            placeholder: "Enter your phone number",
          },
          {
            name: "address",
            type: "text",
            label: "Address",
            value: "{{$json.customerContact.address}}",
            placeholder: "Enter your address",
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
    name: "get_contact_details_form",
    parameters: {},
    description: "Gets the contact details form.",
    type: "form",
  },
  {
    markup: {
      config: {
        buttons: [
          {
            text: "No, details are incorrect",
          },
          {
            text: "Yes, details are correct",
          },
        ],
        isInline: true,
      },
    },
    name: "get_confirmation_form",
    description: "Gets the confirmation form.",
    type: "form",
  },
  {
    markup: {
      config: {
        buttons: [
          {
            text: "Get a quote for a fence",
          },
          {
            text: "I need help with something else",
          },
        ],
        isInline: true,
      },
    },
    name: "get_sub_workflow_initiator_form",
    description: "Sub-workflow initiator form.",
    type: "form",
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
    type: "retrieval",
  },
];

class FunctionController {
  private supabaseService: SupabaseService | null;
  private markup: { [key: string]: unknown };
  private functionsMap: { [key: string]: IFunction };

  constructor() {
    this.supabaseService = null;
    this.markup = {};
    this.functionsMap = {};
  }

  async setDependencies({
    supabaseService,
  }: {
    supabaseService: SupabaseService;
  }) {
    this.supabaseService = supabaseService;
  }

  async executeFunction(fnCall: IFunctionCall): Promise<object | undefined> {
    const fn = this.functionsMap[fnCall.name];

    if (!fn) {
      throw new Error(`Function ${fnCall.name} not found`);
    }

    switch (fn.type) {
      case "markup":
        console.log("SENDING MARKUP");
        return;

      case "form":
        console.log("SENDING FORM");
        return;

      case "retrieval":
        console.log("SENDING RETRIEVAL");
        return;

      case "function":
        console.log("SENDING FUNCTION");
        return;

      default:
        throw new Error(`Function ${fnCall.name} not found`);
    }
  }

  async getFunctions() {
    if (!this.supabaseService) {
      throw new Error("Supabase service not initialized");
    }

    const { data, error } = await this.supabaseService.supabase
      .from("configs")
      .select("*");

    return mockFunctions.map((func: IFunction) => {
      const { markup, type, ...rest } = func;

      if (markup) {
        this.markup[rest.name] = markup;
      }

      this.functionsMap[rest.name] = func;

      return rest;
    });
  }
}

export default FunctionController;
