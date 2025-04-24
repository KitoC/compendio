// NO_CHANGE
import { RequestError } from "@/controllers/RequestController";
import type { IFunction, IFunctionCall } from "@/types/aiAgents";
import { BaseController } from "@/controllers/_BaseController";
import { PublicContext } from "@/middleware/withPublicContext";
import { AuthenticatedContext } from "@/middleware/withAuthenticatedContext";
import { SendEmailHandler } from "@/handlers/ai_functions/SendEmailHandler";
import { IAgentFunctionHandler } from "@/interfaces/IAgentFunctionHandler";
import { OnboardingProgressUpdateHandler } from "@/handlers/ai_functions/OnboardingProgressUpdateHandler";
import {
  onboarding_progress_update,
  get_email_integration_markup_schema,
} from "@/SYSTEM_FUNCTIONS/ONBOARDING_FUNCTIONS";
import { send_email } from "@/SYSTEM_FUNCTIONS/EMAIL_FUNCTIONS";
import { get_records } from "@/SYSTEM_FUNCTIONS/RECORD_FUNCTIONS";
import { DataRecordHandler } from "@/handlers/ai_functions/DataRecordHandler";

export type ExecuteFunctionResult = {
  result: object | string | undefined | null;
  functionMessage?: string;
};

export type ExecuteFunctionCallback = (
  functionCall: IFunctionCall
) => Promise<ExecuteFunctionResult>;

class FunctionController extends BaseController {
  private markup: { [key: string]: unknown };
  private functionsMap: { [key: string]: IFunction };
  private FUNCTION_HANDLERS: { [key: string]: IAgentFunctionHandler };

  constructor(public context: PublicContext | AuthenticatedContext) {
    super();
    this.markup = {};
    this.functionsMap = {
      send_email,
      onboarding_progress_update,
      get_email_integration_markup_schema,
      get_records,
    };

    this.FUNCTION_HANDLERS = {
      [send_email.name]: new SendEmailHandler(this.context),
      [onboarding_progress_update.name]: new OnboardingProgressUpdateHandler(
        this.context
      ),
      [get_records.name]: new DataRecordHandler(this.context),
    };
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

  async executeFunction(fnCall: IFunctionCall): Promise<ExecuteFunctionResult> {
    const fn = this.functionsMap[fnCall.name];

    this.logger.info("🔹 Executing function", fnCall.name);
    this.logger.info("🔹 Function", fn);

    if (!fn) {
      throw new Error(`Function ${fnCall.name} not found`);
    }

    switch (fn.type) {
      case "markup":
        // console.log("SENDING MARKUP");
        return { result: fn, functionMessage: "Markup sent successfully" };

      case "form":
        // console.log("SENDING FORM");
        return {
          result: fn,
          functionMessage: "Tell user you are getting the form ready.",
        };

      case "retrieval":
        // console.log("SENDING RETRIEVAL");
        return { result: fn, functionMessage: "Retrieval sent successfully" };

      case "function":
        if (!this.FUNCTION_HANDLERS[fnCall.name]) {
          throw new Error(`Function handler ${fnCall.name} not found`);
        }
        return this.FUNCTION_HANDLERS[fnCall.name].handle(fnCall, fn);

      default:
        throw new Error(`Function ${fnCall.name} not found`);
    }
  }

  async getFunctions() {
    // Try to get functions from the database first
    const { data, error } = await this.context.supabase
      .from("ai_functions")
      .select("*");

    if (error) {
      return this.throwError("Error fetching functions:", error);
    }

    if (!data || data.length === 0) {
      return [];
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
