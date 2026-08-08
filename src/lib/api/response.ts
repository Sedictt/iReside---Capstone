/**
 * Standardized API Response Envelope
 *
 * Every API route should return responses using these helpers
 * to ensure consistent structure across all endpoints.
 *
 * @module lib/api/response
 */

import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Standard error codes used across the API. */
export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "CONFLICT"
  | "INTERNAL_ERROR"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE";

/** Metadata attached to every API response envelope. */
export interface ApiResponseMetadata {
  readonly timestamp: string;
  readonly requestIdentifier?: string;
}

/** Successful response envelope. */
export interface ApiSuccessEnvelope<T> {
  readonly success: true;
  readonly data: T;
  readonly metadata: ApiResponseMetadata;
}

/** Error response envelope. */
export interface ApiErrorEnvelope {
  readonly success: false;
  readonly error: {
    readonly code: ApiErrorCode;
    readonly message: string;
    readonly details?: unknown;
  };
  readonly metadata: ApiResponseMetadata;
}

/** Paginated response envelope. */
export interface ApiPaginatedEnvelope<T> {
  readonly success: true;
  readonly data: T[];
  readonly pagination: {
    readonly currentPage: number;
    readonly pageSize: number;
    readonly totalCount: number;
    readonly totalPages: number;
  };
  readonly metadata: ApiResponseMetadata;
}

/** Union of all possible API response envelopes. */
export type ApiEnvelope<T> =
  | ApiSuccessEnvelope<T>
  | ApiErrorEnvelope
  | ApiPaginatedEnvelope<T>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds the metadata object attached to every response. */
function buildMetadata(): ApiResponseMetadata {
  return { timestamp: new Date().toISOString() };
}

/**
 * Builds a successful JSON response.
 *
 * @param responseData  - The payload to include in the response.
 * @param httpStatus    - HTTP status code (default 200).
 */
export function apiSuccess<T>(
  responseData: T,
  httpStatus: number = 200,
): NextResponse<ApiSuccessEnvelope<T>> {
  return NextResponse.json(
    {
      success: true,
      data: responseData,
      metadata: buildMetadata(),
    },
    { status: httpStatus },
  );
}

/**
 * Builds an error JSON response.
 *
 * @param errorCode    - Machine-readable error code (e.g. "NOT_FOUND").
 * @param errorMessage - Human-readable description of what went wrong.
 * @param httpStatus   - HTTP status code (default 400).
 * @param errorDetails - Optional extra payload (validation errors, etc.).
 */
export function apiError(
  errorCode: ApiErrorCode,
  errorMessage: string,
  httpStatus: number = 400,
  errorDetails?: unknown,
): NextResponse<ApiErrorEnvelope> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        details: errorDetails,
      },
      metadata: buildMetadata(),
    },
    { status: httpStatus },
  );
}

/**
 * Builds a paginated JSON response.
 *
 * @param responseData - Array of items for the current page.
 * @param currentPage  - Current page number (1-based).
 * @param pageSize     - Number of items per page.
 * @param totalCount   - Total number of items across all pages.
 */
export function apiPaginated<T>(
  responseData: T[],
  currentPage: number,
  pageSize: number,
  totalCount: number,
): NextResponse<ApiPaginatedEnvelope<T>> {
  const totalPages = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;

  return NextResponse.json({
    success: true,
    data: responseData,
    pagination: {
      currentPage,
      pageSize,
      totalCount,
      totalPages,
    },
    metadata: buildMetadata(),
  });
}

// ---------------------------------------------------------------------------
// Convenience short-hands
// ---------------------------------------------------------------------------

/** 401 Unauthorized — the caller must authenticate. */
export function apiUnauthorized(
  errorMessage: string = "Authentication required",
): NextResponse<ApiErrorEnvelope> {
  return apiError("UNAUTHORIZED", errorMessage, 401);
}

/** 403 Forbidden — the caller is authenticated but lacks permissions. */
export function apiForbidden(
  errorMessage: string = "Insufficient permissions",
): NextResponse<ApiErrorEnvelope> {
  return apiError("FORBIDDEN", errorMessage, 403);
}

/** 404 Not Found — the requested resource does not exist. */
export function apiNotFound(
  resourceName: string = "Resource",
): NextResponse<ApiErrorEnvelope> {
  return apiError("NOT_FOUND", `${resourceName} not found`, 404);
}

/** 409 Conflict — the request conflicts with the current state. */
export function apiConflict(
  errorMessage: string,
): NextResponse<ApiErrorEnvelope> {
  return apiError("CONFLICT", errorMessage, 409);
}

/** 500 Internal Server Error — something unexpected failed. */
export function apiInternalError(
  errorMessage: string = "An unexpected error occurred",
): NextResponse<ApiErrorEnvelope> {
  return apiError("INTERNAL_ERROR", errorMessage, 500);
}