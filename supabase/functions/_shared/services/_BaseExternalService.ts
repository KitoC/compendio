import { ExternalServiceAiError } from "@/error-types";
import Logger from "@/utils/Logger";
// @ts-expect-error - Supabase client is not typed
import { SupabaseClient } from "supabase-js";

export class BaseExternalService {
  public logger: Logger;

  constructor() {
    this.logger = new Logger({ name: this.constructor.name });
  }

  throwError(
    message: string,
    errorOrStatus: object | number,
    status: number = 401
  ) {
    const name = this.constructor.name;
    if (typeof errorOrStatus === "object") {
      this.logger.throwAndLog(
        new ExternalServiceAiError(name, message, status, errorOrStatus)
      );
    } else {
      this.logger.throwAndLog(
        new ExternalServiceAiError(name, message, errorOrStatus)
      );
    }
  }
}
