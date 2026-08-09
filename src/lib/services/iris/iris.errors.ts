/**
 * Domain errors for iRis AI Service.
 */
export class IrisError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "IrisError";
  }
}

export class IrisValidationError extends IrisError {
  constructor(message: string) {
    super("IRIS_VALIDATION_ERROR", 400, message);
    this.name = "IrisValidationError";
  }
}

export class IrisRateLimitError extends IrisError {
  constructor(message = "Rate limit exceeded. Please try again later.") {
    super("IRIS_RATE_LIMIT_EXCEEDED", 429, message);
    this.name = "IrisRateLimitError";
  }
}

export class IrisAiProviderError extends IrisError {
  constructor(message = "Failed to generate response from AI.") {
    super("IRIS_AI_PROVIDER_ERROR", 500, message);
    this.name = "IrisAiProviderError";
  }
}
