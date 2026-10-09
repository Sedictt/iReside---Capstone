/**
 * Route-handler validation helpers.
 *
 * Unlike `validation-middleware` (which uses the `apiError` envelope), these
 * keep the `{ error: string }` response shape that the existing route handlers
 * and their client callers already use, and add a `fieldErrors` map so forms
 * can attach server-side failures to the matching inputs.
 *
 * @module lib/validation/server
 */

import { NextResponse } from "next/server";
import type { z } from "zod";

export type FieldErrors = Record<string, string>;

export interface ValidationErrorBody {
  error: string;
  fieldErrors: FieldErrors;
}

/** Flattens Zod issues to `{ "path.to.field": "first message" }`. */
export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "_form";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export function validationErrorResponse(error: z.ZodError, status = 400) {
  const fieldErrors = zodFieldErrors(error);
  const message = error.issues[0]?.message ?? "Invalid request.";
  return NextResponse.json<ValidationErrorBody>({ error: message, fieldErrors }, { status });
}

export type ParseResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

/** Validates an already-obtained value (FormData object, query params, etc.). */
export function parseWithSchema<S extends z.ZodType>(schema: S, value: unknown): ParseResult<z.output<S>> {
  const result = schema.safeParse(value);
  if (!result.success) return { ok: false, response: validationErrorResponse(result.error) };
  return { ok: true, data: result.data };
}

/**
 * Reads and validates a JSON request body. Malformed JSON, non-object bodies,
 * wrong types and unknown enum values all become a 400 with field errors
 * instead of a thrown exception / 500.
 */
export async function parseJsonBody<S extends z.ZodType>(request: Request, schema: S): Promise<ParseResult<z.output<S>>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json<ValidationErrorBody>(
        { error: "Request body must be valid JSON.", fieldErrors: {} },
        { status: 400 },
      ),
    };
  }
  return parseWithSchema(schema, raw);
}

/** Converts `URLSearchParams` to a plain object and validates it. */
export function parseSearchParams<S extends z.ZodType>(searchParams: URLSearchParams, schema: S): ParseResult<z.output<S>> {
  return parseWithSchema(schema, Object.fromEntries(searchParams.entries()));
}

/** Postgres error codes worth translating into user-facing 4xx responses. */
export function databaseErrorResponse(error: { code?: string; message?: string } | null | undefined, fallback = "Unable to save changes.") {
  switch (error?.code) {
    case "23505":
      return NextResponse.json({ error: "A record with these details already exists." }, { status: 409 });
    case "23503":
      return NextResponse.json({ error: "A related record no longer exists. Refresh and try again." }, { status: 409 });
    case "23514":
    case "23502":
    case "22P02":
    case "22007":
    case "22008":
      return NextResponse.json({ error: "Some values are invalid. Check the form and try again." }, { status: 400 });
    default:
      return NextResponse.json({ error: fallback }, { status: 500 });
  }
}
