/**
 * Payment & Billing domain error classes.
 */

export interface PaymentErrorOptions {
  code?: string;
  httpStatus?: number;
  cause?: unknown;
}

export class PaymentError extends Error {
  readonly code: string;
  readonly httpStatus: number;

  constructor(message: string, options: PaymentErrorOptions = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code ?? "PAYMENT_ERROR";
    this.httpStatus = options.httpStatus ?? 500;
    if (options.cause) this.cause = options.cause;
  }
}

/** Thrown when a payment cannot be found. */
export class PaymentNotFoundError extends PaymentError {
  constructor(paymentId: string) {
    super(`Payment with id "${paymentId}" was not found.`, {
      code: "PAYMENT_NOT_FOUND",
      httpStatus: 404,
    });
  }
}

/** Thrown when a user does not have permission to view or modify a payment. */
export class PaymentAccessError extends PaymentError {
  constructor(message = "You do not have permission to access this payment record.") {
    super(message, {
      code: "PAYMENT_ACCESS_DENIED",
      httpStatus: 403,
    });
  }
}

/** Thrown when an invalid transition or action is performed on a payment. */
export class InvalidPaymentStateError extends PaymentError {
  constructor(message: string) {
    super(message, {
      code: "PAYMENT_INVALID_STATE",
      httpStatus: 409,
    });
  }
}

/** Thrown when input validation fails for payment creation/update. */
export class PaymentValidationError extends PaymentError {
  constructor(message: string) {
    super(message, {
      code: "PAYMENT_VALIDATION_ERROR",
      httpStatus: 400,
    });
  }
}
