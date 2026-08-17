import { describe, it, expect } from "vitest";
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  toApiResponseEnvelope,
} from "../app-error";

describe("AppError Hierarchy", () => {
  it("creates base AppError with correct properties", () => {
    const error = new AppError("NOT_FOUND", 404, "Custom message", { id: "123" });
    expect(error.name).toBe("AppError");
    expect(error.errorCode).toBe("NOT_FOUND");
    expect(error.httpStatus).toBe(404);
    expect(error.message).toBe("Custom message");
    expect(error.details).toEqual({ id: "123" });
  });

  it("creates specialized error subclasses", () => {
    const notFound = new NotFoundError("Lease", "lease-123");
    expect(notFound.httpStatus).toBe(404);
    expect(notFound.errorCode).toBe("NOT_FOUND");
    expect(notFound.message).toBe("Lease not found: lease-123");

    const unauthorized = new UnauthorizedError();
    expect(unauthorized.httpStatus).toBe(401);
    expect(unauthorized.errorCode).toBe("UNAUTHORIZED");

    const forbidden = new ForbiddenError();
    expect(forbidden.httpStatus).toBe(403);
    expect(forbidden.errorCode).toBe("FORBIDDEN");

    const validation = new ValidationError("Invalid field", { field: "email" });
    expect(validation.httpStatus).toBe(400);
    expect(validation.errorCode).toBe("VALIDATION_FAILED");
    expect(validation.details).toEqual({ field: "email" });

    const conflict = new ConflictError("State conflict");
    expect(conflict.httpStatus).toBe(409);
    expect(conflict.errorCode).toBe("CONFLICT");

    const rateLimit = new RateLimitError();
    expect(rateLimit.httpStatus).toBe(429);
    expect(rateLimit.errorCode).toBe("RATE_LIMITED");

    const internal = new InternalServerError();
    expect(internal.httpStatus).toBe(500);
    expect(internal.errorCode).toBe("INTERNAL_ERROR");
  });

  it("converts AppError into standardized ApiResponse", async () => {
    const error = new NotFoundError("Property", "prop-99");
    const response = toApiResponseEnvelope(error);
    expect(response.status).toBe(404);

    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("NOT_FOUND");
    expect(json.error.message).toBe("Property not found: prop-99");
    expect(json.metadata.timestamp).toBeDefined();
  });

  it("converts standard Error into 500 ApiResponse", async () => {
    const error = new Error("Database timeout");
    const response = toApiResponseEnvelope(error);
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INTERNAL_ERROR");
    expect(json.error.message).toBe("Database timeout");
  });

  it("converts unknown thrown value into generic 500 response", async () => {
    const response = toApiResponseEnvelope("string exception");
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INTERNAL_ERROR");
  });
});
