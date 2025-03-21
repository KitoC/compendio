// NO_CHANGE
import SupabaseController from "locals/controllers/SupabaseController";
import { RequestError } from "locals/controllers/RequestController";
import type {
  IFunction,
  IFunctionCall,
} from "../../../../src/types/aiAgents.js";
import Logger from "locals/utils/Logger.js";

// const mockFunctions: IFunction[] = [
//   {
//     name: "get_current_price_items",
//     parameters: {},
//     description: "Gets the current price items from the database.",
//     type: "retrieval",
//   },
//   {
//     markup: {
//       prompt:
//         "From the provided price items, please extract all DISTINCT materials used for fences.",
//       schema: {
//         name: "materials",
//         schema: {
//           type: "object",
//           properties: {
//             options: {
//               type: "array",
//               items: {
//                 type: "object",
//                 properties: {
//                   id: {
//                     type: "string",
//                   },
//                   name: {
//                     type: "string",
//                   },
//                   tags: {
//                     type: "array",
//                     items: {
//                       type: "string",
//                     },
//                   },
//                   imgUrl: {
//                     type: "string",
//                   },
//                   description: {
//                     type: "string",
//                   },
//                 },
//                 additionalProperties: false,
//               },
//             },
//           },
//           additionalProperties: false,
//         },
//         strict: false,
//       },
//       formOptions: {
//         isMulti: false,
//       },
//     },
//     name: "get_fencing_materials_form",
//     parameters: {},
//     description: "Gets the fencing materials form.",
//     type: "form",
//   },
//   {
//     markup: {
//       config: {
//         fields: [
//           {
//             name: "name",
//             type: "text",
//             label: "Name",
//             value: "{{$json.customerContact.fullName}}",
//             placeholder: "Enter your name",
//           },
//           {
//             name: "email",
//             type: "email",
//             label: "Email",
//             value: "{{$json.customerContact.email}}",
//             placeholder: "Enter your email",
//           },
//           {
//             name: "phone_number",
//             type: "tel",
//             label: "Phone",
//             value: "{{$json.customerContact.phone_number}}",
//             placeholder: "Enter your phone number",
//           },
//           {
//             name: "address",
//             type: "text",
//             label: "Address",
//             value: "{{$json.customerContact.address}}",
//             placeholder: "Enter your address",
//           },
//           {
//             name: "data_storage_confirmation",
//             type: "checkbox",
//             label: "I agree to storage of my contact details",
//             value: true,
//           },
//         ],
//         isSystem: true,
//       },
//     },
//     name: "get_contact_details_form",
//     parameters: {},
//     description: "Gets the contact details form.",
//     type: "form",
//   },
//   {
//     markup: {
//       config: {
//         buttons: [
//           {
//             text: "No, details are incorrect",
//           },
//           {
//             text: "Yes, details are correct",
//           },
//         ],
//         isInline: true,
//       },
//     },
//     name: "get_confirmation_form",
//     description: "Gets the confirmation form.",
//     type: "form",
//   },
//   {
//     markup: {
//       config: {
//         buttons: [
//           {
//             text: "Get a quote for a fence",
//           },
//           {
//             text: "I need help with something else",
//           },
//         ],
//         isInline: true,
//       },
//     },
//     name: "get_sub_workflow_initiator_form",
//     description: "Sub-workflow initiator form.",
//     type: "form",
//   },
//   {
//     name: "price_history",
//     parameters: {
//       type: "object",
//       properties: {
//         query: {
//           type: "string",
//           description: "The query to search the price history for.",
//         },
//       },
//     },
//     description: "Vector database of price history.",
//     type: "retrieval",
//   },
// ];

class FunctionController {
  private supabaseController: typeof SupabaseController;
  private markup: { [key: string]: unknown };
  private functionsMap: { [key: string]: IFunction };
  private logger: Logger;

  constructor() {
    this.supabaseController = SupabaseController;
    this.markup = {};
    this.functionsMap = {};
    this.logger = new Logger({ name: "FunctionController" });
  }

  get supabase() {
    return this.supabaseController.supabase;
  }

  throwError(
    message: string,
    errorOrStatus: object | number,
    status: number = 401
  ) {
    if (typeof errorOrStatus === "object") {
      this.logger.throwAndLog(new RequestError(message, status, errorOrStatus));
    } else {
      this.logger.throwAndLog(new RequestError(message, errorOrStatus));
    }
  }

  async executeFunction(fnCall: IFunctionCall): Promise<object | undefined> {
    const fn = this.functionsMap[fnCall.name];

    if (!fn) {
      throw new Error(`Function ${fnCall.name} not found`);
    }

    switch (fn.type) {
      case "markup":
        // console.log("SENDING MARKUP");
        return fn;

      case "form":
        // console.log("SENDING FORM");
        return fn;

      case "retrieval":
        // console.log("SENDING RETRIEVAL");
        return fn;

      case "function":
        // console.log("SENDING FUNCTION");
        return fn;

      default:
        throw new Error(`Function ${fnCall.name} not found`);
    }
  }

  async getFunctions() {
    // Try to get functions from the database first
    const { data, error } = await this.supabaseController.supabase
      .from("ai_functions")
      .select("*");

    if (error) {
      return this.throwError("Error fetching functions:", error);
    }

    if (!data || data.length === 0) {
      return this.throwError("No functions found", 404);
    }

    if (data && data.length > 0) {
      // Process functions from the database
      return data.map((func: IFunction) => {
        const {
          id,
          name,
          description,
          type,
          parameters,
          markup,
          config,
          schema,
        } = func;

        if (markup) {
          this.markup[name] = markup;
        }

        this.functionsMap[name] = {
          id,
          name,
          description,
          type,
          parameters: parameters || {},
          markup: markup || {},
          config: config || {},
          schema: schema || {},
        };

        return {
          name,
          description,
          parameters: parameters || {},
        };
      });
    }
  }
}

export { FunctionController };
export default new FunctionController();
