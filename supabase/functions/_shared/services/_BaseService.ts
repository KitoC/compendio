import { ServiceError } from "locals/error-types";
import Logger from "locals/utils/Logger";
// @ts-expect-error - Supabase client is not typed
import { SupabaseClient } from "supabase-js";

interface RequiredContext {
  supabase: SupabaseClient;
  supabase_AS_SUPER_ADMIN: SupabaseClient;
}

export class BaseService {
  public logger: Logger;
  public isAdmin: boolean;

  constructor(public context: RequiredContext) {
    this.logger = new Logger({ name: "BaseService" });
    this.isAdmin = false;
  }

  setRunAsSuperAdmin(value: boolean) {
    this.isAdmin = value;
  }

  get supabase() {
    if (this.isAdmin) {
      this.logger.warn("WARNING: RUNNING AS SUPER ADMIN");

      return this.context.supabase_AS_SUPER_ADMIN;
    }

    return this.context.supabase;
  }

  get supabase_AS_SUPER_ADMIN() {
    return this.context.supabase_AS_SUPER_ADMIN;
  }

  throwError(
    message: string,
    errorOrStatus: object | number,
    status: number = 401
  ) {
    const name = this.constructor.name;
    if (typeof errorOrStatus === "object") {
      this.logger.throwAndLog(
        new ServiceError(name, message, status, errorOrStatus)
      );
    } else {
      this.logger.throwAndLog(new ServiceError(name, message, errorOrStatus));
    }
  }
}
