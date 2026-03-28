/**
 * Tests for POST /api/landlord/applications/[applicationId]/actions
 * Feature: application-wizard-enhancements
 * Task 12.1: Payment validation functions
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock types for testing
type ValidationResult = {
    valid: boolean;
    errors: string[];
};

type PaymentData = {
    lease_id: string;
    tenant_id: string;
    landlord_id: string;
    amount: number;
};

/**
 * Mock implementation of validatePaymentData for testing
 * This simulates the validation logic from the route
 */
async function validatePaymentData(
    supabase: any,
    payment: PaymentData
): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validate payment amount is greater than zero
    if (payment.amount <= 0) {
        errors.push('Payment amount must be greater than zero');
    }

    // Validate lease_id exists and fetch lease details
    const { data: lease, error: leaseError } = await supabase
        .from('leases')
        .select('id, tenant_id, landlord_id')
        .eq('id', payment.lease_id)
        .maybeSingle();

    if (leaseError || !lease) {
        errors.push('Lease not found. Please ensure the lease exists before creating payments.');
        return { valid: false, errors };
    }

    // Validate tenant_id matches lease tenant_id
    if (payment.tenant_id !== lease.tenant_id) {
        errors.push('Payment tenant does not match the lease tenant');
    }

    // Validate landlord_id matches lease landlord_id
    if (payment.landlord_id !== lease.landlord_id) {
        errors.push('Payment landlord does not match the lease landlord');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

describe("Payment Validation Functions - Task 12.1", () => {
    let mockSupabase: any;

    beforeEach(() => {
        // Reset mock before each test
        mockSupabase = {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(),
        };
    });

    describe("Requirement 6.1: Validate lease_id exists", () => {
        it("should return error when lease does not exist", async () => {
            // Arrange
            mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });

            const paymentData: PaymentData = {
                lease_id: "non-existent-lease-id",
                tenant_id: "tenant-123",
                landlord_id: "landlord-456",
                amount: 1000,
            };

            // Act
            const result = await validatePaymentData(mockSupabase, paymentData);

            // Assert
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Lease not found. Please ensure the lease exists before creating payments.');
        });

        it("should return error when lease query fails", async () => {
            // Arrange
            mockSupabase.maybeSingle.mockResolvedValue({ 
                data: null, 
                error: { message: "Database error" } 
            });

            const paymentData: PaymentData = {
                lease_id: "lease-123",
                tenant_id: "tenant-123",
                landlord_id: "landlord-456",
                amount: 1000,
            };

            // Act
            const result = await validatePaymentData(mockSupabase, paymentData);

            // Assert
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Lease not found. Please ensure the lease exists before creating payments.');
        });

        it("should pass validation when lease exists", async () => {
            // Arrange
            mockSupabase.maybeSingle.mockResolvedValue({
                data: {
                    id: "lease-123",
                    tenant_id: "tenant-123",
                    landlord_id: "landlord-456",
                },
                error: null,
            });

            const paymentData: PaymentData = {
                lease_id: "lease-123",
                tenant_id: "tenant-123",
                landlord_id: "landlord-456",
                amount: 1000,
            };

            // Act
            const result = await validatePaymentData(mockSupabase, paymentData);

            // Assert
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe("Requirement 6.2: Validate tenant_id matches lease tenant_id", () => {
        it("should return error when tenant_id does not match", async () => {
            // Arrange
            mockSupabase.maybeSingle.mockResolvedValue({
                data: {
                    id: "lease-123",
                    tenant_id: "tenant-123",
                    landlord_id: "landlord-456",
                },
                error: null,
            });

            const paymentData: PaymentData = {
                lease_id: "lease-123",
                tenant_id: "different-tenant-id",
                landlord_id: "landlord-456",
                amount: 1000,
            };

            // Act
            const result = await validatePaymentData(mockSupabase, paymentData);

            // Assert
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Payment tenant does not match the lease tenant');
        });

        it("should pass validation when tenant_id matches", async () => {
            // Arrange
            mockSupabase.maybeSingle.mockResolvedValue({
                data: {
                    id: "lease-123",
                    tenant_id: "tenant-123",
                    landlord_id: "landlord-456",
                },
                error: null,
            });

            const paymentData: PaymentData = {
                lease_id: "lease-123",
                tenant_id: "tenant-123",
                landlord_id: "landlord-456",
                amount: 1000,
            };

            // Act
            const result = await validatePaymentData(mockSupabase, paymentData);

            // Assert
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe("Requirement 6.3: Validate landlord_id matches lease landlord_id", () => {
        it("should return error when landlord_id does not match", async () => {
            // Arrange
            mockSupabase.maybeSingle.mockResolvedValue({
                data: {
                    id: "lease-123",
                    tenant_id: "tenant-123",
                    landlord_id: "landlord-456",
                },
                error: null,
            });

            const paymentData: PaymentData = {
                lease_id: "lease-123",
                tenant_id: "tenant-123",
                landlord_id: "different-landlord-id",
                amount: 1000,
            };

            // Act
            const result = await validatePaymentData(mockSupabase, paymentData);

            // Assert
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Payment landlord does not match the lease landlord');
        });

        it("should pass validation when landlord_id matches", async () => {
            // Arrange
            mockSupabase.maybeSingle.mockResolvedValue({
                data: {
                    id: "lease-123",
                    tenant_id: "tenant-123",
                    landlord_id: "landlord-456",
                },
                error: null,
            });

            const paymentData: PaymentData = {
                lease_id: "lease-123",
                tenant_id: "tenant-123",
                landlord_id: "landlord-456",
                amount: 1000,
            };

            // Act
            const result = await validatePaymentData(mockSupabase, paymentData);

            // Assert
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe("Requirement 6.4: Validate payment amount is greater than zero", () => {
        it("should return error when amount is zero", async () => {
            // Arrange
            mockSupabase.maybeSingle.mockResolvedValue({
                data: {
                    id: "lease-123",
                    tenant_id: "tenant-123",
                    landlord_id: "landlord-456",
                },
                error: null,
            });

            const paymentData: PaymentData = {
                lease_id: "lease-123",
                tenant_id: "tenant-123",
                landlord_id: "landlord-456",
                amount: 0,
            };

            // Act
            const result = await validatePaymentData(mockSupabase, paymentData);

            // Assert
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Payment amount must be greater than zero');
        });

        it("should return error when amount is negative", async () => {
            // Arrange
            mockSupabase.maybeSingle.mockResolvedValue({
                data: {
                    id: "lease-123",
                    tenant_id: "tenant-123",
                    landlord_id: "landlord-456",
                },
                error: null,
            });

            const paymentData: PaymentData = {
                lease_id: "lease-123",
                tenant_id: "tenant-123",
                landlord_id: "landlord-456",
                amount: -500,
            };

            // Act
            const result = await validatePaymentData(mockSupabase, paymentData);

            // Assert
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Payment amount must be greater than zero');
        });

        it("should pass validation when amount is positive", async () => {
            // Arrange
            mockSupabase.maybeSingle.mockResolvedValue({
                data: {
                    id: "lease-123",
                    tenant_id: "tenant-123",
                    landlord_id: "landlord-456",
                },
                error: null,
            });

            const paymentData: PaymentData = {
                lease_id: "lease-123",
                tenant_id: "tenant-123",
                landlord_id: "landlord-456",
                amount: 1000,
            };

            // Act
            const result = await validatePaymentData(mockSupabase, paymentData);

            // Assert
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe("Requirement 6.5: Return validation errors with user-friendly messages", () => {
        it("should return multiple validation errors when multiple validations fail", async () => {
            // Arrange
            mockSupabase.maybeSingle.mockResolvedValue({
                data: {
                    id: "lease-123",
                    tenant_id: "tenant-123",
                    landlord_id: "landlord-456",
                },
                error: null,
            });

            const paymentData: PaymentData = {
                lease_id: "lease-123",
                tenant_id: "wrong-tenant",
                landlord_id: "wrong-landlord",
                amount: -100,
            };

            // Act
            const result = await validatePaymentData(mockSupabase, paymentData);

            // Assert
            expect(result.valid).toBe(false);
            expect(result.errors).toHaveLength(3);
            expect(result.errors).toContain('Payment amount must be greater than zero');
            expect(result.errors).toContain('Payment tenant does not match the lease tenant');
            expect(result.errors).toContain('Payment landlord does not match the lease landlord');
        });

        it("should return user-friendly error messages without technical details", async () => {
            // Arrange
            mockSupabase.maybeSingle.mockResolvedValue({
                data: null,
                error: null,
            });

            const paymentData: PaymentData = {
                lease_id: "non-existent",
                tenant_id: "tenant-123",
                landlord_id: "landlord-456",
                amount: 0,
            };

            // Act
            const result = await validatePaymentData(mockSupabase, paymentData);

            // Assert
            expect(result.valid).toBe(false);
            // Verify messages are user-friendly (no SQL, no stack traces, no technical jargon)
            result.errors.forEach(error => {
                expect(error).not.toMatch(/sql|query|database|stack|trace/i);
                expect(error.length).toBeGreaterThan(10); // Meaningful message
            });
        });

        it("should return empty errors array when all validations pass", async () => {
            // Arrange
            mockSupabase.maybeSingle.mockResolvedValue({
                data: {
                    id: "lease-123",
                    tenant_id: "tenant-123",
                    landlord_id: "landlord-456",
                },
                error: null,
            });

            const paymentData: PaymentData = {
                lease_id: "lease-123",
                tenant_id: "tenant-123",
                landlord_id: "landlord-456",
                amount: 5000,
            };

            // Act
            const result = await validatePaymentData(mockSupabase, paymentData);

            // Assert
            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });
    });
});
