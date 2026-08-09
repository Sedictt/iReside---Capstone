/**
 * Domain errors for Maintenance Service.
 */
export class MaintenanceError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "MaintenanceError";
  }
}

export class MaintenanceNotFoundError extends MaintenanceError {
  constructor(requestId: string) {
    super(
      "MAINTENANCE_NOT_FOUND",
      404,
      `Maintenance request not found: ${requestId}`,
    );
    this.name = "MaintenanceNotFoundError";
  }
}

export class MaintenanceAccessError extends MaintenanceError {
  constructor(message = "Access to maintenance request is denied.") {
    super("MAINTENANCE_ACCESS_DENIED", 403, message);
    this.name = "MaintenanceAccessError";
  }
}

export class MaintenanceValidationError extends MaintenanceError {
  constructor(message: string) {
    super("MAINTENANCE_VALIDATION_ERROR", 400, message);
    this.name = "MaintenanceValidationError";
  }
}
