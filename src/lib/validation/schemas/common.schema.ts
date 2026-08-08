/**
 * Common Validation Schemas
 *
 * Reusable Zod schemas for the most frequent validation patterns:
 * UUIDs, email addresses, pagination, date ranges, etc.
 *
 * @module lib/validation/schemas/common
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** Validates a UUID v4 string. */
export const uuidSchema = z.uuid();

/** Validates an email address. */
export const emailSchema = z.email();

/** Validates a non-empty trimmed string. */
export const nonEmptyStringSchema = z.string().trim().min(1);

/** Validates a trimmed string with a maximum length. */
export function maxLengthStringSchema(maximumLength: number) {
  return z.string().trim().max(maximumLength);
}

/** Validates a positive integer. */
export const positiveIntegerSchema = z.number().int().positive();

/** Validates a non-negative integer (>= 0). */
export const nonNegativeIntegerSchema = z.number().int().min(0);

/** Validates a numeric ID (positive integer, commonly used for database IDs). */
export const numericIdSchema = z.number().int().positive();

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

/** Query parameters for paginated list endpoints. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/** Inferred type for pagination query parameters. */
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

/** Validates an ISO 8601 date string. */
export const isoDateSchema = z.iso.date();

/** Validates an ISO 8601 datetime string. */
export const isoDatetimeSchema = z.iso.datetime();

/** Query parameters for date-range filtering. */
export const dateRangeQuerySchema = z.object({
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
});

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/** Query parameters for search endpoints. */
export const searchQuerySchema = z.object({
  query: z.string().trim().min(1).max(200),
});

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

/** Query parameters for sorting. */
export const sortingQuerySchema = z.object({
  sortField: z.string().trim().min(1).optional(),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});