/**
 * Community domain error hierarchy.
 */

export class CommunityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommunityError";
  }
}

export class PostNotFoundError extends CommunityError {
  constructor(public readonly postId: string) {
    super(`Community post not found: ${postId}`);
    this.name = "PostNotFoundError";
  }
}

export class CommunityAccessError extends CommunityError {
  constructor(message = "Unauthorized: Access to community resource is forbidden.") {
    super(message);
    this.name = "CommunityAccessError";
  }
}

export class CommunityValidationError extends CommunityError {
  constructor(
    message: string,
    public readonly validationErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "CommunityValidationError";
  }
}
