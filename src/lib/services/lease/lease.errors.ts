/**
 * Lease service domain errors.
 *
 * Each error carries a stable `code` and an `httpStatus` so routes can map
 * failures to HTTP responses without re-parsing messages.
 */

export interface LeaseErrorOptions {
  code: string;
  httpStatus: number;
  cause?: unknown;
}

export class LeaseError extends Error {
  readonly code: string;
  readonly httpStatus: number;

  constructor(message: string, options: LeaseErrorOptions) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = new.target.name;
    this.code = options.code;
    this.httpStatus = options.httpStatus;
  }
}

/** Thrown when a lease cannot be found (PostgREST no-rows). */
export class LeaseNotFoundError extends LeaseError {
  constructor(leaseId?: string) {
    super(
      leaseId ? `Lease not found: ${leaseId}` : "Lease not found",
      { code: "LEASE_NOT_FOUND", httpStatus: 404 },
    );
  }
}

/** Thrown when the caller lacks access to the lease. */
export class LeaseAccessError extends LeaseError {
  constructor(message = "You do not have access to this lease") {
    super(message, { code: "LEASE_ACCESS_DENIED", httpStatus: 403 });
  }
}

/** Thrown when a status transition is not permitted by the state machine. */
export class InvalidLeaseTransitionError extends LeaseError {
  constructor(message: string) {
    super(message, { code: "LEASE_INVALID_TRANSITION", httpStatus: 409 });
  }
}

/** Thrown when a lease is not in a valid state or condition for signing. */
export class LeaseSigningEligibilityError extends LeaseError {
  constructor(message: string) {
    super(message, { code: "LEASE_NOT_ELIGIBLE_FOR_SIGNING", httpStatus: 409 });
  }
}