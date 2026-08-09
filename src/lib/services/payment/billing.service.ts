/**
 * BillingService — utility billing computation and meter reading management.
 *
 * Scoped to an injected SupabaseClient instance.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UtilityBillingMode } from "@/types/database";
import type { RecordUtilityReadingInput, UtilityReadingRow } from "./payment.types";
import { PaymentAccessError, PaymentNotFoundError, PaymentValidationError } from "./payment.errors";
import { computeUsage, computeUtilityCharge } from "@/lib/billing/utils";

export class BillingService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Fetch utility readings for a landlord with optional lease or property filtering.
   *
   * @param landlordId - Landlord user ID.
   * @param options - Optional filters by leaseId or propertyId.
   * @returns Array of utility reading records.
   */
  async listUtilityReadings(
    landlordId: string,
    options?: { leaseId?: string; propertyId?: string },
  ): Promise<UtilityReadingRow[]> {
    let query = this.supabase
      .from("utility_readings")
      .select("*")
      .eq("landlord_id", landlordId);

    if (options?.leaseId) {
      query = query.eq("lease_id", options.leaseId);
    }

    if (options?.propertyId) {
      query = query.eq("property_id", options.propertyId);
    }

    const { data: readingsData, error: readingsError } = await query.order("entered_at", {
      ascending: false,
    });


    if (readingsError) {
      throw new Error(`Failed to fetch utility readings: ${readingsError.message}`);
    }

    return readingsData ?? [];
  }

  /**
   * Record a new utility meter reading, calculate usage & charges against active utility configs.
   *
   * @param landlordId - Landlord user ID.
   * @param payload - Meter reading input payload.
   * @returns Created utility reading row.
   */
  async recordUtilityReading(
    landlordId: string,
    payload: RecordUtilityReadingInput,
  ): Promise<UtilityReadingRow> {
    if (payload.currentReading < payload.previousReading) {
      throw new PaymentValidationError(
        "Current reading cannot be lower than the previous reading.",
      );
    }

    // 1. Verify lease ownership
    const { data: lease, error: leaseError } = await this.supabase
      .from("leases")
      .select("id, unit_id, landlord_id")
      .eq("id", payload.leaseId)
      .eq("landlord_id", landlordId)
      .maybeSingle();

    if (leaseError) {
      throw new Error(`Failed to fetch lease: ${leaseError.message}`);
    }

    if (!lease) {
      throw new PaymentAccessError("Unauthorized or lease not found for this landlord.");
    }

    // 2. Fetch unit & property
    const { data: unit, error: unitError } = await this.supabase
      .from("units")
      .select("id, property_id")
      .eq("id", lease.unit_id)
      .single();

    if (unitError || !unit) {
      throw new PaymentNotFoundError(lease.unit_id);
    }

    // 3. Find utility configuration
    const { data: configs, error: configError } = await this.supabase
      .from("utility_configs")
      .select("*")
      .eq("landlord_id", landlordId)
      .eq("property_id", unit.property_id)
      .eq("utility_type", payload.utilityType)
      .eq("is_active", true)
      .order("unit_id", { ascending: false });

    if (configError) {
      throw new Error(`Failed to fetch utility configs: ${configError.message}`);
    }

    const config =
      (configs ?? []).find((item) => item.unit_id === lease.unit_id) ??
      (configs ?? []).find((item) => item.unit_id === null);

    if (!config) {
      throw new PaymentValidationError(
        `No active utility configuration found for utility type: ${payload.utilityType}`,
      );
    }

    // 4. Calculate usage & charge
    const usage = computeUsage(payload.previousReading, payload.currentReading);
    const computedCharge = computeUtilityCharge({
      mode: config.billing_mode,
      ratePerUnit: Number(config.rate_per_unit ?? 0),
      usage,
    });

    const currentTimestamp = new Date().toISOString();

    // 5. Insert reading record
    const { data: createdReading, error: insertError } = await this.supabase
      .from("utility_readings")
      .insert({
        landlord_id: landlordId,
        lease_id: payload.leaseId,
        property_id: unit.property_id,
        unit_id: lease.unit_id,
        utility_type: payload.utilityType,
        billing_mode: config.billing_mode,
        billing_period_start: payload.billingPeriodStart,
        billing_period_end: payload.billingPeriodEnd,
        previous_reading: payload.previousReading,
        current_reading: payload.currentReading,
        usage,
        billed_rate: Number(config.rate_per_unit ?? 0),
        computed_charge: computedCharge,
        note: payload.note ?? null,
        proof_image_path: payload.proofImagePath ?? null,
        proof_image_url: payload.proofImageUrl ?? null,
        status: "pending",
        entered_at: currentTimestamp,
        created_at: currentTimestamp,
        updated_at: currentTimestamp,
      })
      .select()
      .single();

    if (insertError || !createdReading) {
      throw new Error(`Failed to record utility reading: ${insertError?.message}`);
    }

    return createdReading;
  }
}
