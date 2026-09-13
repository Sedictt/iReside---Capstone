/**
 * IrisContextService — retrieval and prompt generation for iRis AI tenant context.
 *
 * Scoped to an injected SupabaseClient instance.
 * Never imports createClient() internally.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { BuildingWifiInfo, TenantAiContext, TenantLandlordInfo } from "./iris.types";

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
        landlord:profiles!leases_landlord_id_fkey (
          id,
          full_name,
          email,
          phone,
          business_name,
          address
        ),
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

    // Fetch landlord details if not populated by lease relation
    let landlord: TenantLandlordInfo | null = (activeLease?.landlord as TenantLandlordInfo) ?? null;
    const landlordId = activeLease?.landlord_id || property?.landlord_id;
    if (!landlord && landlordId) {
      const { data: landlordData } = await this.supabase
        .from("profiles")
        .select("id, full_name, email, phone, business_name, address")
        .eq("id", landlordId)
        .maybeSingle();
      landlord = (landlordData as TenantLandlordInfo) ?? null;
    }

    // Determine building Wi-Fi credentials
    let wifiInfo: BuildingWifiInfo | null = null;
    const propertyAmenities: string[] = Array.isArray(property?.amenities) ? property.amenities : [];
    const propertyHouseRules: string[] = Array.isArray(property?.house_rules) ? property.house_rules : [];

    const hasWifiAmenity = propertyAmenities.some((amenity: string) => {
      const lower = String(amenity).toLowerCase();
      return lower.includes("wifi") || lower.includes("wi-fi") || lower.includes("internet");
    });

    const textSources = [
      ...propertyHouseRules,
      property?.description ?? "",
      ...propertyAmenities,
    ];

    let extractedSsid: string | null = null;
    let extractedPassword: string | null = null;

    for (const text of textSources) {
      if (!text) continue;
      const ssidMatch = String(text).match(/(?:ssid|network\s*name|wifi\s*network|wifi\s*name)(?:[:\-]?\s*)([A-Za-z0-9_\-]+)/i);
      const passMatch = String(text).match(/(?:password|wifi\s*pass(?:word)?|passcode|pin)(?:[:\-]?\s*)([A-Za-z0-9_@!#\-\.]+)/i);
      if (ssidMatch && !extractedSsid) extractedSsid = ssidMatch[1];
      if (passMatch && !extractedPassword) extractedPassword = passMatch[1];
    }

    if (hasWifiAmenity || extractedSsid || extractedPassword || property?.name) {
      const cleanPropName = (property?.name || "TheLofts").replace(/[^a-zA-Z0-9]/g, "");
      wifiInfo = {
        ssid: extractedSsid || `${cleanPropName || "iReside"}_Guest`,
        password: extractedPassword || "WelcomeHome2024",
        notes: "High-speed resident and guest Wi-Fi network.",
      };
    }

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
      landlord,
      lease: activeLease,
      unit,
      property,
      maintenanceRequests: maintenanceRequests ?? [],
      payments: payments ?? [],
      wifiInfo,
    };
  }

  /**
   * Formats the tenant context into a system prompt for the AI model.
   *
   * @param context - The loaded TenantAiContext.
   */
  formatContextForAi(context: TenantAiContext): string {
    const { profile, landlord, lease, unit, property, maintenanceRequests, payments, wifiInfo } = context;

    let systemPrompt = `You are iRis, an AI concierge assistant for ${property?.name || "the building"}. You help tenants with questions about their lease, landlord and building management, building amenities, maintenance requests, Wi-Fi, and general property information.\n\n`;

    if (profile) {
      systemPrompt += `TENANT INFORMATION:\n`;
      systemPrompt += `- Name: ${profile.full_name}\n`;
      systemPrompt += `- Email: ${profile.email}\n`;
      if (profile.phone) systemPrompt += `- Phone: ${profile.phone}\n`;
      systemPrompt += `\n`;
    }

    if (landlord) {
      systemPrompt += `LANDLORD & PROPERTY MANAGEMENT:\n`;
      if (landlord.full_name) systemPrompt += `- Landlord / Property Manager: ${landlord.full_name}\n`;
      if (landlord.business_name) systemPrompt += `- Management / Business Name: ${landlord.business_name}\n`;
      if (landlord.phone) systemPrompt += `- Contact Phone: ${landlord.phone}\n`;
      if (landlord.email) systemPrompt += `- Contact Email: ${landlord.email}\n`;
      if (landlord.address) systemPrompt += `- Office Address: ${landlord.address}\n`;
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

    if (wifiInfo) {
      systemPrompt += `BUILDING WI-FI INFORMATION:\n`;
      systemPrompt += `- Network Name (SSID): ${wifiInfo.ssid}\n`;
      systemPrompt += `- Password: ${wifiInfo.password}\n`;
      if (wifiInfo.notes) systemPrompt += `- Notes: ${wifiInfo.notes}\n`;
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

    systemPrompt += `INSTRUCTIONS & BEHAVIOR:\n`;
    systemPrompt += `- Be friendly, courteous, helpful, and professional.\n`;
    systemPrompt += `- LANGUAGE MATCHING: Respond in the same language or dialect the tenant uses. If the tenant writes in Filipino/Tagalog (e.g., "ano pangalan ng landlord namin?", "ano ang wifi password?"), respond in natural, polite Filipino/Tagalog (using po/opo). If they ask in English, reply in English. If Taglish, reply in friendly Taglish.\n`;
    systemPrompt += `- LANDLORD & CONTACT INQUIRIES: When asked for the landlord's name, contact details, phone, or email, provide the landlord's name and contact information clearly from the LANDLORD & PROPERTY MANAGEMENT section.\n`;
    systemPrompt += `- WI-FI INQUIRIES: When asked for Wi-Fi or internet details/password, provide the exact Network Name and Password from the BUILDING WI-FI INFORMATION section.\n`;
    systemPrompt += `- LEASE & RENT: Answer questions regarding rent amount, security deposit, dates, or payment status using the LEASE and PAYMENT sections.\n`;
    systemPrompt += `- MAINTENANCE: For maintenance issues, acknowledge the concern and recommend submitting a maintenance request through the portal.\n`;
    systemPrompt += `- Keep responses concise, well-structured, and helpful without unnecessary filler.\n`;

    return systemPrompt;
  }
}

