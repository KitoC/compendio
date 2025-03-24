import { DSLError } from "locals/error-types";
import Logger from "locals/utils/Logger";

export class BaseDSLLayer {
  public logger: Logger;

  constructor() {
    this.logger = new Logger({ name: "BaseDSLLayer" });
  }

  throwError(
    message: string,
    errorOrStatus: object | number,
    status: number = 401
  ) {
    const name = this.constructor.name;
    if (typeof errorOrStatus === "object") {
      this.logger.throwAndLog(
        new DSLError(name, message, status, errorOrStatus)
      );
    } else {
      this.logger.throwAndLog(new DSLError(name, message, errorOrStatus));
    }
  }
}
