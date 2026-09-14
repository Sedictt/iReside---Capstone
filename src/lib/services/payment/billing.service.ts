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

    let config =
      (configs ?? []).find((item) => item.unit_id === lease.unit_id) ??
      (configs ?? []).find((item) => item.unit_id === null);

    if (!config) {
      // Auto-provision a default utility config for the property so reading logging is never blocked
      const { data: newConfig } = await this.supabase
        .from("utility_configs")
        .insert({
          landlord_id: landlordId,
          property_id: unit.property_id,
          unit_id: null,
          utility_type: payload.utilityType,
          billing_mode: "tenant_paid",
          rate_per_unit: 0,
          unit_label: payload.utilityType === "electricity" ? "kWh" : "m³",
          is_active: true,
        })
        .select()
        .single();

      if (newConfig) {
        config = newConfig;
      }
    }

    const billingMode: UtilityBillingMode = config?.billing_mode ?? "tenant_paid";
    const billedRate = Number(config?.rate_per_unit ?? 0);

    // 4. Calculate usage & charge
    const usage = computeUsage(payload.previousReading, payload.currentReading);
    const computedCharge = computeUtilityCharge({
      mode: billingMode,
      ratePerUnit: billedRate,
      usage,
    });

    const currentTimestamp = new Date().toISOString();

    // 5. Check if reading already exists for this unit + utility_type + period (to prevent unique constraint error)
    const { data: existingReading } = await this.supabase
      .from("utility_readings")
      .select("id, payment_id")
      .eq("unit_id", lease.unit_id)
      .eq("utility_type", payload.utilityType)
      .eq("billing_period_start", payload.billingPeriodStart)
      .eq("billing_period_end", payload.billingPeriodEnd)
      .maybeSingle();

    let createdReading;
    if (existingReading) {
      const { data: updatedReading, error: updateError } = await this.supabase
        .from("utility_readings")
        .update({
          lease_id: payload.leaseId,
          previous_reading: payload.previousReading,
          current_reading: payload.currentReading,
          usage,
          billed_rate: billedRate,
          computed_charge: computedCharge,
          note: payload.note ?? null,
          proof_image_path: payload.proofImagePath ?? null,
          proof_image_url: payload.proofImageUrl ?? null,
          updated_at: currentTimestamp,
        })
        .eq("id", existingReading.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update utility reading: ${updateError.message}`);
      }
      createdReading = updatedReading;
    } else {
      const { data: insertedReading, error: insertError } = await this.supabase
        .from("utility_readings")
        .insert({
          landlord_id: landlordId,
          lease_id: payload.leaseId,
          property_id: unit.property_id,
          unit_id: lease.unit_id,
          utility_type: payload.utilityType,
          billing_mode: billingMode,
          billing_period_start: payload.billingPeriodStart,
          billing_period_end: payload.billingPeriodEnd,
          previous_reading: payload.previousReading,
          current_reading: payload.currentReading,
          usage,
          billed_rate: billedRate,
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

      if (insertError || !insertedReading) {
        throw new Error(`Failed to record utility reading: ${insertError?.message}`);
      }
      createdReading = insertedReading;
    }

    return createdReading;
  }
}
