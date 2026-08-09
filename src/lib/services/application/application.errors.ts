/**
 * Application domain error hierarchy.
 */

export class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApplicationError";
  }
}

export class ApplicationNotFoundError extends ApplicationError {
  constructor(public readonly applicationId: string) {
    super(`Application not found: ${applicationId}`);
    this.name = "ApplicationNotFoundError";
  }
}

export class ApplicationAccessError extends ApplicationError {
  constructor(message = "Unauthorized: Access to this application is forbidden.") {
    super(message);
    this.name = "ApplicationAccessError";
  }
}

export class InvalidApplicationStateError extends ApplicationError {
  constructor(
    public readonly currentStatus: string,
    public readonly attemptedStatus: string,
    message?: string,
  ) {
    super(
      message ??
        `Invalid application status transition from "${currentStatus}" to "${attemptedStatus}".`,
    );
    this.name = "InvalidApplicationStateError";
  }
}

export class ApplicationValidationError extends ApplicationError {
  constructor(
    message: string,
    public readonly validationErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApplicationValidationError";
  }
}
