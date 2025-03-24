import { ControllerError, ServiceError } from "locals/error-types";
import Logger from "locals/utils/Logger";

export class BaseController {
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
        new ControllerError(name, message, status, errorOrStatus)
      );
    } else {
      this.logger.throwAndLog(
        new ControllerError(name, message, errorOrStatus)
      );
    }
  }
}
