/**
 * IrisContextService — retrieval and prompt generation for iRis AI tenant context.
 *
 * Scoped to an injected SupabaseClient instance.
 * Never imports createClient() internally.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { TenantAiContext } from "./iris.types";

export class IrisContextService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Retrieves relevant context for the iRis AI assistant based on the tenant's profile and active lease.
   *
   * @param tenantId - Authenticated tenant user ID.
   */
  async getTenantContext(tenantId: string): Promise<TenantAiContext> {
    const { data: profile } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", tenantId)
      .maybeSingle();

    const { data: leases } = await this.supabase
      .from("leases")
      .select(
        `
        *,
        unit:units (
          *,
          property:properties (*)
        )
      `,
      )
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1);

    const activeLease = (leases?.[0] as any) ?? null;
    const unit = activeLease?.unit ?? null;
    const property = unit?.property ?? null;

    const { data: maintenanceRequests } = await this.supabase
      .from("maintenance_requests")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: payments } = await this.supabase
      .from("payments")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(5);

    return {
      profile: profile ?? null,
      lease: activeLease,
      unit,
      property,
      maintenanceRequests: maintenanceRequests ?? [],
      payments: payments ?? [],
    };
  }

  /**
   * Formats the tenant context into a system prompt for the AI model.
   *
   * @param context - The loaded TenantAiContext.
   */
  formatContextForAi(context: TenantAiContext): string {
    const { profile, lease, unit, property, maintenanceRequests, payments } = context;

    let systemPrompt = `You are iRis, an AI concierge assistant for ${property?.name || "the building"}. You help tenants with questions about their lease, building amenities, maintenance requests, and general property information.\n\n`;

    if (profile) {
      systemPrompt += `TENANT INFORMATION:\n`;
      systemPrompt += `- Name: ${profile.full_name}\n`;
      systemPrompt += `- Email: ${profile.email}\n`;
      if (profile.phone) systemPrompt += `- Phone: ${profile.phone}\n`;
      systemPrompt += `\n`;
    }

    if (property) {
      systemPrompt += `BUILDING INFORMATION:\n`;
      systemPrompt += `- Name: ${property.name}\n`;
      systemPrompt += `- Address: ${property.address}, ${property.city}\n`;
      systemPrompt += `- Type: ${property.type}\n`;
      if (property.description) systemPrompt += `- Description: ${property.description}\n`;

      if (property.amenities && property.amenities.length > 0) {
        systemPrompt += `- Amenities: ${property.amenities.join(", ")}\n`;
      }

      if (property.house_rules && property.house_rules.length > 0) {
        systemPrompt += `- House Rules: ${property.house_rules.join("; ")}\n`;
      }
      systemPrompt += `\n`;
    }

    if (unit) {
      systemPrompt += `UNIT INFORMATION:\n`;
      systemPrompt += `- Unit: ${unit.name}\n`;
      systemPrompt += `- Floor: ${unit.floor}\n`;
      systemPrompt += `- Bedrooms: ${unit.beds}\n`;
      systemPrompt += `- Bathrooms: ${unit.baths}\n`;
      if (unit.sqft) systemPrompt += `- Square Feet: ${unit.sqft}\n`;
      systemPrompt += `\n`;
    }

    if (lease) {
      systemPrompt += `LEASE INFORMATION:\n`;
      systemPrompt += `- Status: ${lease.status}\n`;
      systemPrompt += `- Start Date: ${new Date(lease.start_date).toLocaleDateString()}\n`;
      systemPrompt += `- End Date: ${new Date(lease.end_date).toLocaleDateString()}\n`;
      systemPrompt += `- Monthly Rent: ₱${Number(lease.monthly_rent).toLocaleString()}\n`;
      systemPrompt += `- Security Deposit: ₱${Number(lease.security_deposit).toLocaleString()}\n`;
      if (lease.terms) {
        systemPrompt += `- Additional Terms: ${JSON.stringify(lease.terms)}\n`;
      }
      systemPrompt += `\n`;
    }

    if (maintenanceRequests.length > 0) {
      systemPrompt += `RECENT MAINTENANCE REQUESTS:\n`;
      maintenanceRequests.forEach((requestItem, index) => {
        systemPrompt += `${index + 1}. ${requestItem.title} - Status: ${requestItem.status} (${requestItem.priority} priority)\n`;
      });
      systemPrompt += `\n`;
    }

    if (payments.length > 0) {
      const lastPayment = payments[0];
      systemPrompt += `RECENT PAYMENT:\n`;
      systemPrompt += `- Amount: ₱${Number(lastPayment.amount).toLocaleString()}\n`;
      systemPrompt += `- Status: ${lastPayment.status}\n`;
      systemPrompt += `- Date: ${new Date(lastPayment.created_at).toLocaleDateString()}\n`;
      systemPrompt += `\n`;
    }

    systemPrompt += `INSTRUCTIONS:\n`;
    systemPrompt += `- Be friendly, helpful, and professional\n`;
    systemPrompt += `- Answer questions about the building, lease, amenities, and services\n`;
    systemPrompt += `- If asked about WiFi, provide network details if available in amenities\n`;
    systemPrompt += `- For maintenance issues, acknowledge and suggest submitting a maintenance request\n`;
    systemPrompt += `- For payment questions, refer to the recent payment information\n`;
    systemPrompt += `- If you don't have specific information, politely say so and suggest contacting the landlord\n`;
    systemPrompt += `- Keep responses concise and helpful\n`;

    return systemPrompt;
  }
}
