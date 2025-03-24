import { ServiceError } from "locals/error-types";
import Logger from "locals/utils/Logger";

export class BaseService {
  public logger: Logger;

  constructor() {
    this.logger = new Logger({ name: "BaseService" });
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
