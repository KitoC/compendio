export class RequestError extends Error {
  constructor(
    public message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "RequestError";
  }
}

export class ServiceError extends Error {
  public type: string;

  constructor(
    public origin: string,
    public message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.type = "ServiceError";
  }
}

export class DSLError extends Error {
  public type: string;

  constructor(
    public origin: string,
    public message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.type = "DSLError";
  }
}

export class ControllerError extends Error {
  public type: string;
  constructor(
    public origin: string,
    public message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.type = "ControllerError";
  }
}

export class ProviderError extends Error {
  public type: string;
  constructor(
    public origin: string,
    public message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.type = "ProviderError";
  }
}

export class AuthorizationError extends RequestError {
  constructor(message: string, details?: unknown) {
    super(message, 401, details);
    this.name = "AuthorizationError";
  }
}
