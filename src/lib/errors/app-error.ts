/**
 * Centralized Application Error Hierarchy.
 *
 * Provides standardized error classes and a mapping helper to convert errors
 * into ApiErrorEnvelope responses.
 *
 * @module lib/errors/app-error
 */
import { NextResponse } from "next/server";
import { apiError, type ApiErrorCode, type ApiErrorEnvelope } from "@/lib/api/response";

export class AppError extends Error {
  constructor(
    public readonly errorCode: ApiErrorCode,
    public readonly httpStatus: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resourceName: string, identifier?: string) {
    const detailMessage = identifier
      ? `${resourceName} not found: ${identifier}`
      : `${resourceName} not found`;
    super("NOT_FOUND", 404, detailMessage);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super("UNAUTHORIZED", 401, message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Insufficient permissions") {
    super("FORBIDDEN", 403, message);
    this.name = "ForbiddenError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Request validation failed", details?: unknown) {
    super("VALIDATION_FAILED", 400, message, details);
    this.name = "ValidationError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super("CONFLICT", 409, message, details);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Rate limit exceeded. Please try again later.") {
    super("RATE_LIMITED", 429, message);
    this.name = "RateLimitError";
  }
}

export class InternalServerError extends AppError {
  constructor(message = "An unexpected error occurred", details?: unknown) {
    super("INTERNAL_ERROR", 500, message, details);
    this.name = "InternalServerError";
  }
}

/**
 * Converts any caught error into a standardized NextResponse with ApiErrorEnvelope.
 *
 * @param error - The caught error or unknown thrown value.
 * @returns NextResponse<ApiErrorEnvelope>
 */
export function toApiResponseEnvelope(error: unknown): NextResponse<ApiErrorEnvelope> {
  if (error instanceof AppError) {
    return apiError(error.errorCode, error.message, error.httpStatus, error.details);
  }

  if (error instanceof Error) {
    // Check if error object has statusCode / status property
    const statusCandidate = (error as any).statusCode || (error as any).status;
    const httpStatus =
      typeof statusCandidate === "number" && statusCandidate >= 400 && statusCandidate < 600
        ? statusCandidate
        : 500;

    const errorCode: ApiErrorCode =
      httpStatus === 401
        ? "UNAUTHORIZED"
        : httpStatus === 403
          ? "FORBIDDEN"
          : httpStatus === 404
            ? "NOT_FOUND"
            : httpStatus === 409
              ? "CONFLICT"
              : httpStatus === 429
                ? "RATE_LIMITED"
                : httpStatus === 400
                  ? "VALIDATION_FAILED"
                  : "INTERNAL_ERROR";

    return apiError(errorCode, error.message, httpStatus);
  }

  return apiError("INTERNAL_ERROR", "An unexpected error occurred.", 500);
}
