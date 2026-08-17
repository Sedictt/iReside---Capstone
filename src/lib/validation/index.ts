/**
 * Validation Module — Barrel Export
 *
 * @module lib/validation
 */

// Middleware
export {
  validateRequestBody,
  validateQueryParams,
  validateRouteParams,
} from "./validation-middleware";

// Common schemas
export {
  uuidSchema,
  emailSchema,
  nonEmptyStringSchema,
  maxLengthStringSchema,
  positiveIntegerSchema,
  nonNegativeIntegerSchema,
  numericIdSchema,
  paginationQuerySchema,
  isoDateSchema,
  isoDatetimeSchema,
  dateRangeQuerySchema,
  searchQuerySchema,
  sortingQuerySchema,
} from "./schemas/common.schema";

export type { PaginationQuery } from "./schemas/common.schema";

// Auth schemas
export {
  loginSchema,
  signupSchema,
  otpRequestSchema,
  otpVerifySchema,
  changePasswordSchema,
  resetPasswordRequestSchema,
  updateProfileSchema,
} from "./schemas/auth.schema";

export type {
  LoginInput,
  SignupInput,
  OtpRequestInput,
  OtpVerifyInput,
  ChangePasswordInput,
  ResetPasswordRequestInput,
  UpdateProfileInput,
} from "./schemas/auth.schema";