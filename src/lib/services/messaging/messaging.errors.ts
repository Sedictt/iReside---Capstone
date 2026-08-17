/**
 * Messaging domain error hierarchy.
 */

export class MessagingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MessagingError";
  }
}

export class ConversationNotFoundError extends MessagingError {
  constructor(public readonly conversationId: string) {
    super(`Conversation not found: ${conversationId}`);
    this.name = "ConversationNotFoundError";
  }
}

export class MessagingAccessError extends MessagingError {
  constructor(message = "Unauthorized: Access to this conversation is forbidden.") {
    super(message);
    this.name = "MessagingAccessError";
  }
}

export class MessagingValidationError extends MessagingError {
  constructor(
    message: string,
    public readonly validationErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "MessagingValidationError";
  }
}
