/**
 * API Utilities — Barrel Export
 *
 * @module lib/api
 */

export {
  apiSuccess,
  apiError,
  apiPaginated,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiConflict,
  apiInternalError,
} from "./response";

export type {
  ApiSuccessEnvelope,
  ApiErrorEnvelope,
  ApiPaginatedEnvelope,
  ApiEnvelope,
  ApiErrorCode,
  ApiResponseMetadata,
} from "./response";

export {
  requireAuthenticatedUser,
  requireRole,
  requireLandlordOwnsProperty,
  requireAccessToLease,
} from "./auth-guard";

export type { AuthenticatedContext } from "./auth-guard";