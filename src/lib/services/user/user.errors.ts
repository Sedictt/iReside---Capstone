/**
 * User & Profile domain error hierarchy.
 */

export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}

export class UserNotFoundError extends UserError {
  constructor(public readonly userId: string) {
    super(`User not found: ${userId}`);
    this.name = "UserNotFoundError";
  }
}

export class UserAccessError extends UserError {
  constructor(message = "Unauthorized: Access forbidden.") {
    super(message);
    this.name = "UserAccessError";
  }
}

export class UserValidationError extends UserError {
  constructor(
    message: string,
    public readonly validationErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "UserValidationError";
  }
}
