/**
 * Notification domain error hierarchy.
 */

export class NotificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotificationError";
  }
}

export class NotificationNotFoundError extends NotificationError {
  constructor(public readonly notificationId: string) {
    super(`Notification not found: ${notificationId}`);
    this.name = "NotificationNotFoundError";
  }
}

export class NotificationValidationError extends NotificationError {
  constructor(
    message: string,
    public readonly validationErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "NotificationValidationError";
  }
}
