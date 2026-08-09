/**
 * Property domain error hierarchy.
 */

export class PropertyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PropertyError";
  }
}

export class PropertyNotFoundError extends PropertyError {
  constructor(public readonly propertyId: string) {
    super(`Property not found: ${propertyId}`);
    this.name = "PropertyNotFoundError";
  }
}

export class UnitNotFoundError extends PropertyError {
  constructor(public readonly unitId: string) {
    super(`Unit not found: ${unitId}`);
    this.name = "UnitNotFoundError";
  }
}

export class PropertyAccessError extends PropertyError {
  constructor(message = "Access to this property is denied.") {
    super(message);
    this.name = "PropertyAccessError";
  }
}

export class PropertyValidationError extends PropertyError {
  constructor(
    message: string,
    public readonly validationErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "PropertyValidationError";
  }
}
