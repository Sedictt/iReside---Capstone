/**
 * Validation Middleware
 *
 * Thin wrappers around Zod that parse and validate incoming request data,
 * returning typed data or throwing a 400 error response.
 *
 * @module lib/validation/validation-middleware
 */

import { NextRequest } from "next/server";
import { z, ZodSchema } from "zod";
import { apiError } from "@/lib/api/response";

// ---------------------------------------------------------------------------
// Body validation
// ---------------------------------------------------------------------------

/**
 * Parses and validates the JSON body of a request against a Zod schema.
 *
 * @param validationSchema - The Zod schema to validate against.
 * @param request          - The incoming Next.js request.
 * @returns The parsed and typed body data.
 * @throws 400 NextResponse if the body is missing, malformed, or invalid.
 */
export async function validateRequestBody<T>(
  validationSchema: ZodSchema<T>,
  request: NextRequest,
): Promise<T> {
  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    throw apiError(
      "VALIDATION_FAILED",
      "Request body must be valid JSON",
      400,
    );
  }

  const parsedBody = validationSchema.safeParse(rawBody);

  if (!parsedBody.success) {
    throw apiError(
      "VALIDATION_FAILED",
      "Request body validation failed",
      400,
      parsedBody.error.issues,
    );
  }

  return parsedBody.data;
}

/**
 * Parses and validates the URL query parameters of a request against a Zod schema.
 *
 * @param validationSchema - The Zod schema to validate against.
 * @param request          - The incoming Next.js request.
 * @returns The parsed and typed query parameters.
 * @throws 400 NextResponse if the query params are invalid.
 */
export function validateQueryParams<T>(
  validationSchema: ZodSchema<T>,
  request: NextRequest,
): T {
  const searchParameters = Object.fromEntries(
    request.nextUrl.searchParams.entries(),
  );

  const parsedParameters = validationSchema.safeParse(searchParameters);

  if (!parsedParameters.success) {
    throw apiError(
      "VALIDATION_FAILED",
      "Query parameter validation failed",
      400,
      parsedParameters.error.issues,
    );
  }

  return parsedParameters.data;
}

/**
 * Parses and validates URL path parameters against a Zod schema.
 *
 * Use this in dynamic route handlers (e.g., `[leaseId]`) to ensure
 * the path segment meets your constraints.
 *
 * @param validationSchema - The Zod schema to validate against.
 * @param routeParameters  - The raw params object from the route handler.
 * @returns The parsed and typed route parameters.
 * @throws 400 NextResponse if the params are invalid.
 */
export function validateRouteParams<T extends Record<string, string>>(
  validationSchema: ZodSchema<T>,
  routeParameters: Record<string, string>,
): T {
  const parsedParameters = validationSchema.safeParse(routeParameters);

  if (!parsedParameters.success) {
    throw apiError(
      "VALIDATION_FAILED",
      "Route parameter validation failed",
      400,
      parsedParameters.error.issues,
    );
  }

  return parsedParameters.data;
}