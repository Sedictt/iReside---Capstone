import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { InvoiceBuildContext, UtilityReadingState } from "./iris-fsm";
import { roundCentavos } from "./iris-invoice-flow";

export interface QuickSettlementInput {
  invoiceId: string;
  amount: number;
  method: "cash" | "bank_transfer" | "in_person";
  referenceNumber?: string;
  paymentDate: string;
  note?: string;
}

export const QuickSettlementInputSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  amount: z.number().positive("Settlement amount must be greater than zero"),
  method: z.enum(["cash", "bank_transfer", "in_person"]),
  referenceNumber: z.string().optional(),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Payment date must be YYYY-MM-DD"),
  note: z.string().optional(),
});

export interface QuickSettlementResult {
  success: boolean;
  receiptNumber: string;
  invoiceId: string;
  amountPaid: number;
  previousBalance: number;
  remainingBalance: number;
  status: "completed" | "partial";
  paymentDate: string;
  method: "cash" | "bank_transfer" | "in_person";
  referenceNumber?: string;
  note?: string;
}

export interface LandlordPropertySummary {
  id: string;
  name: string;
  totalUnits: number;
  occupiedUnits: number;
}

export interface ActiveLeaseSummary {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantEmail?: string;
  tenantPhone?: string;
  unitId: string;
  unitName: string;
  propertyId: string;
  propertyName: string;
  monthlyRent: number;
  startDate: string;
  endDate: string;
  outstandingBalance: number;
  daysOverdue: number;
  dueDate: string;
}

export interface MaintenanceTicketSummary {
  id: string;
  unitId: string;
  unitName: string;
  propertyId: string;
  propertyName: string;
  tenantName: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "assigned" | "in_progress" | "resolved" | "closed" | "cancelled";
  assignedTechnician?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface LandlordOperationsContext {
  landlordId: string;
  properties: LandlordPropertySummary[];
  activeLeases: ActiveLeaseSummary[];
  overdueLeases: ActiveLeaseSummary[];
  openTickets: MaintenanceTicketSummary[];
  expiringLeases?: ActiveLeaseSummary[];
  totalReceivables: number;
  occupancyRate: number;
}

export type AudienceFilterType =
  | "all_active_tenants"
  | "overdue_5d"
  | "due_soon"
  | "expiring_leases_60d";

export interface AudienceFilterOptions {
  referenceDate?: string; // YYYY-MM-DD, defaults to today
  propertyId?: string;
  dueSoonDaysThreshold?: number; // defaults to 5
}

/**
 * Deterministically generates an official receipt number in format REC-YYYYMM-XXXXX
 */
export function generateReceiptNumber(paymentDateStr?: string, seedCode?: string): string {
  const date = paymentDateStr ? new Date(paymentDateStr) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const randomSuffix =
    seedCode ??
    Math.random().toString(36).substring(2, 7).toUpperCase();
  return `REC-${year}${month}-${randomSuffix.padEnd(5, "X").substring(0, 5)}`;
}

/**
 * Filter audience based on operational criteria.
 */
export function filterAudience(
  leases: ActiveLeaseSummary[],
  filterType: AudienceFilterType,
  options: AudienceFilterOptions = {}
): ActiveLeaseSummary[] {
  const refDate = options.referenceDate ? new Date(options.referenceDate) : new Date();
  const dueSoonDays = options.dueSoonDaysThreshold ?? 5;

  let filtered = leases;
  if (options.propertyId) {
    filtered = filtered.filter((l) => l.propertyId === options.propertyId);
  }

  switch (filterType) {
    case "all_active_tenants":
      return filtered;

    case "overdue_5d":
      return filtered.filter(
        (l) => l.outstandingBalance > 0 && l.daysOverdue >= 5
      );

    case "due_soon":
      return filtered.filter((l) => {
        if (!l.dueDate) return false;
        const dueDate = new Date(l.dueDate);
        const diffDays = Math.ceil(
          (dueDate.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return diffDays >= 0 && diffDays <= dueSoonDays && l.outstandingBalance > 0;
      });

    case "expiring_leases_60d":
      return filtered.filter((l) => {
        if (!l.endDate) return false;
        const endDate = new Date(l.endDate);
        const diffDays = Math.ceil(
          (endDate.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return diffDays >= 0 && diffDays <= 60;
      });

    default:
      return filtered;
  }
}

/**
 * Evaluates and records a quick settlement against an outstanding balance.
 */
export function recordQuickSettlement(
  input: QuickSettlementInput,
  currentInvoice: { id: string; totalAmount: number; currentBalance: number },
  receiptSeed?: string
): QuickSettlementResult {
  const parsed = QuickSettlementInputSchema.parse(input);

  if (currentInvoice.id !== parsed.invoiceId) {
    throw new Error(
      `Invoice ID mismatch: expected ${currentInvoice.id}, got ${parsed.invoiceId}`
    );
  }

  if (currentInvoice.currentBalance <= 0) {
    throw new Error("Cannot record payment: invoice is already fully settled");
  }

  const roundedAmount = roundCentavos(parsed.amount);
  const remaining = roundCentavos(
    Math.max(0, currentInvoice.currentBalance - roundedAmount)
  );

  const receiptNumber = generateReceiptNumber(parsed.paymentDate, receiptSeed);

  return {
    success: true,
    receiptNumber,
    invoiceId: parsed.invoiceId,
    amountPaid: roundedAmount,
    previousBalance: currentInvoice.currentBalance,
    remainingBalance: remaining,
    status: remaining === 0 ? "completed" : "partial",
    paymentDate: parsed.paymentDate,
    method: parsed.method,
    referenceNumber: parsed.referenceNumber,
    note: parsed.note,
  };
}

/**
 * Validates and executes a maintenance ticket status transition.
 */
export function updateMaintenanceTicketStatus(
  currentTicket: MaintenanceTicketSummary,
  targetStatus: MaintenanceTicketSummary["status"],
  updates?: { assignedTechnician?: string; notes?: string }
): MaintenanceTicketSummary {
  const allowedTransitions: Record<
    MaintenanceTicketSummary["status"],
    readonly MaintenanceTicketSummary["status"][]
  > = {
    pending: ["assigned", "in_progress", "cancelled"],
    assigned: ["in_progress", "pending", "cancelled"],
    in_progress: ["resolved", "assigned", "cancelled"],
    resolved: ["closed", "in_progress"],
    closed: ["in_progress"], // Reopen
    cancelled: ["pending"], // Reopen
  };

  const allowed = allowedTransitions[currentTicket.status];
  if (!allowed || !allowed.includes(targetStatus)) {
    throw new Error(
      `Illegal ticket status transition from ${currentTicket.status} to ${targetStatus}`
    );
  }

  if (targetStatus === "assigned" && !updates?.assignedTechnician && !currentTicket.assignedTechnician) {
    throw new Error("Cannot assign ticket without specifying a technician");
  }

  return {
    ...currentTicket,
    status: targetStatus,
    assignedTechnician: updates?.assignedTechnician ?? currentTicket.assignedTechnician,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Builds aggregated operations context from provided properties, leases, and tickets.
 */
export function buildOperationsContext(
  landlordId: string,
  properties: LandlordPropertySummary[],
  leases: ActiveLeaseSummary[],
  tickets: MaintenanceTicketSummary[]
): LandlordOperationsContext {
  const overdueLeases = leases.filter(
    (l) => l.outstandingBalance > 0 && l.daysOverdue > 0
  );

  const now = new Date();
  const expiringLeases = leases.filter((l) => {
    if (!l.endDate) return false;
    const endDate = new Date(l.endDate);
    const diffDays = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays >= 0 && diffDays <= 60;
  });

  const totalReceivables = leases.reduce(
    (sum, l) => roundCentavos(sum + l.outstandingBalance),
    0
  );

  const totalUnits = properties.reduce((sum, p) => sum + p.totalUnits, 0);
  const occupiedUnits = properties.reduce((sum, p) => sum + p.occupiedUnits, 0);
  const occupancyRate = totalUnits > 0 ? roundCentavos((occupiedUnits / totalUnits) * 100) : 0;

  const openTickets = tickets.filter(
    (t) => t.status !== "closed" && t.status !== "cancelled"
  );

  return {
    landlordId,
    properties,
    activeLeases: leases,
    overdueLeases,
    openTickets,
    expiringLeases,
    totalReceivables,
    occupancyRate,
  };
}

// ---------------------------------------------------------------------------
// Server-Side Database Context Operations
// ---------------------------------------------------------------------------

/**
 * Verifies that a property belongs to the authenticated landlord.
 */
export async function verifyLandlordPropertyOwnership(
  supabase: SupabaseClient<Database>,
  landlordId: string,
  propertyId: string
): Promise<boolean> {
  if (!landlordId || !propertyId) return false;
  const { data, error } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("landlord_id", landlordId)
    .maybeSingle();

  return !error && !!data;
}

/**
 * Verifies that a lease belongs to the authenticated landlord.
 */
export async function verifyLandlordLeaseOwnership(
  supabase: SupabaseClient<Database>,
  landlordId: string,
  leaseId: string
): Promise<boolean> {
  if (!landlordId || !leaseId) return false;
  const { data, error } = await supabase
    .from("leases")
    .select("id, landlord_id")
    .eq("id", leaseId)
    .eq("landlord_id", landlordId)
    .maybeSingle();

  return !error && !!data;
}

/**
 * Fetches complete pre-filled InvoiceBuildContext for a specific lease.
 */
export async function getLeaseInvoiceContext(
  supabase: SupabaseClient<Database>,
  landlordId: string,
  leaseId: string
): Promise<InvoiceBuildContext | null> {
  // 1. Verify lease belongs to landlord
  const { data: lease, error: leaseError } = await supabase
    .from("leases")
    .select("id, unit_id, tenant_id, landlord_id, monthly_rent, status")
    .eq("id", leaseId)
    .eq("landlord_id", landlordId)
    .maybeSingle();

  if (leaseError || !lease) {
    return null;
  }

  // 2. Fetch unit and property info
  const { data: unit } = await supabase
    .from("units")
    .select("id, name, property_id")
    .eq("id", lease.unit_id)
    .maybeSingle();

  let propertyName = "Property";
  let propertyId = unit?.property_id ?? "";
  if (propertyId) {
    const { data: prop } = await supabase
      .from("properties")
      .select("name")
      .eq("id", propertyId)
      .maybeSingle();
    if (prop) {
      propertyName = prop.name;
    }
  }

  // 3. Fetch tenant profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", lease.tenant_id)
    .maybeSingle();

  const tenantName = profile?.full_name ?? "Tenant";

  // 4. Fetch active utility configs for water and electricity
  const { data: utilityConfigs } = await supabase
    .from("utility_configs")
    .select("*")
    .eq("landlord_id", landlordId)
    .eq("property_id", propertyId)
    .eq("is_active", true);

  const waterConfig = (utilityConfigs ?? []).find((c) => c.utility_type === "water");
  const electricConfig = (utilityConfigs ?? []).find((c) => c.utility_type === "electricity");

  // 5. Fetch previous readings from utility_readings
  const { data: latestWaterReading } = await supabase
    .from("utility_readings")
    .select("current_reading")
    .eq("unit_id", lease.unit_id)
    .eq("utility_type", "water")
    .order("entered_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: latestElectricReading } = await supabase
    .from("utility_readings")
    .select("current_reading")
    .eq("unit_id", lease.unit_id)
    .eq("utility_type", "electricity")
    .order("entered_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  // Default due date: 15 days from now
  const due = new Date();
  due.setDate(due.getDate() + 15);
  const dueDateStr = due.toISOString().split("T")[0];

  const waterState: UtilityReadingState | undefined = waterConfig
    ? {
        configId: waterConfig.id,
        billingMode: waterConfig.billing_mode,
        ratePerUnit: waterConfig.rate_per_unit,
        previousReading: latestWaterReading?.current_reading ?? 0,
      }
    : undefined;

  const electricState: UtilityReadingState | undefined = electricConfig
    ? {
        configId: electricConfig.id,
        billingMode: electricConfig.billing_mode,
        ratePerUnit: electricConfig.rate_per_unit,
        previousReading: latestElectricReading?.current_reading ?? 0,
      }
    : undefined;

  return {
    leaseId: lease.id,
    tenantId: lease.tenant_id,
    tenantName,
    unitId: lease.unit_id,
    unitName: unit?.name ?? "Unit",
    propertyId,
    propertyName,
    monthlyRent: lease.monthly_rent,
    billingMonth: currentYearMonth,
    dueDate: dueDateStr,
    water: waterState,
    electricity: electricState,
    customItems: [],
    notes: "",
  };
}

/**
 * Loads comprehensive landlord operational context:
 * - Owned properties and occupancy
 * - Active leases with tenant profiles
 * - Overdue accounts / pending payments
 * - Open maintenance tickets
 * - Leases expiring within 60 days
 */
export async function getLandlordOperationalContext(
  supabase: SupabaseClient<Database>,
  landlordId: string,
  propertyIdFilter?: string
): Promise<LandlordOperationsContext> {
  // 1. Fetch properties
  let propQuery = supabase
    .from("properties")
    .select("id, name")
    .eq("landlord_id", landlordId);

  if (propertyIdFilter) {
    propQuery = propQuery.eq("id", propertyIdFilter);
  }

  const { data: propertiesData } = await propQuery;
  const properties = propertiesData ?? [];
  const propertyIds = properties.map((p) => p.id);

  if (propertyIds.length === 0) {
    return {
      landlordId,
      properties: [],
      activeLeases: [],
      overdueLeases: [],
      openTickets: [],
      expiringLeases: [],
      totalReceivables: 0,
      occupancyRate: 0,
    };
  }

  // 2. Fetch units for occupancy
  const { data: unitsData } = await supabase
    .from("units")
    .select("id, name, property_id, status")
    .in("property_id", propertyIds);
  const units = unitsData ?? [];

  // Group units by property
  const propertySummaries: LandlordPropertySummary[] = properties.map((prop) => {
    const propUnits = units.filter((u) => u.property_id === prop.id);
    const occupied = propUnits.filter((u) => u.status === "occupied").length;
    return {
      id: prop.id,
      name: prop.name,
      totalUnits: propUnits.length,
      occupiedUnits: occupied,
    };
  });

  // 3. Fetch active leases
  let leaseQuery = supabase
    .from("leases")
    .select("id, unit_id, tenant_id, landlord_id, monthly_rent, start_date, end_date, status")
    .eq("landlord_id", landlordId)
    .eq("status", "active");

  const { data: leasesData } = await leaseQuery;
  const leases = leasesData ?? [];

  // Filter leases belonging to filtered properties if any
  const unitMap = new Map(units.map((u) => [u.id, u]));
  const propMap = new Map(properties.map((p) => [p.id, p]));

  const relevantLeases = leases.filter((l) => {
    const u = unitMap.get(l.unit_id);
    return u && propertyIds.includes(u.property_id);
  });

  // 4. Fetch tenant profiles for relevant leases
  const tenantIds = Array.from(new Set(relevantLeases.map((l) => l.tenant_id)));
  const profileMap = new Map<string, { full_name: string; email?: string; phone?: string }>();

  if (tenantIds.length > 0) {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .in("id", tenantIds);
    (profilesData ?? []).forEach((p) => {
      profileMap.set(p.id, {
        full_name: p.full_name,
        email: p.email,
        phone: p.phone ?? undefined,
      });
    });
  }

  // 5. Fetch pending/overdue payments
  const leaseIds = relevantLeases.map((l) => l.id);
  const paymentsByLease = new Map<string, { totalPending: number; earliestDueDate?: string; maxDaysOverdue: number }>();

  if (leaseIds.length > 0) {
    const { data: paymentsData } = await supabase
      .from("payments")
      .select("lease_id, amount, due_date, status")
      .in("lease_id", leaseIds)
      .eq("status", "pending");

    const today = new Date();
    (paymentsData ?? []).forEach((pmt) => {
      const existing = paymentsByLease.get(pmt.lease_id) ?? {
        totalPending: 0,
        maxDaysOverdue: 0,
      };
      existing.totalPending = roundCentavos(existing.totalPending + pmt.amount);

      if (pmt.due_date) {
        if (!existing.earliestDueDate || pmt.due_date < existing.earliestDueDate) {
          existing.earliestDueDate = pmt.due_date;
        }
        const dueDate = new Date(pmt.due_date);
        const days = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        if (days > existing.maxDaysOverdue) {
          existing.maxDaysOverdue = days;
        }
      }
      paymentsByLease.set(pmt.lease_id, existing);
    });
  }

  // 6. Assemble ActiveLeaseSummary
  const activeLeaseSummaries: ActiveLeaseSummary[] = relevantLeases.map((l) => {
    const u = unitMap.get(l.unit_id);
    const p = u ? propMap.get(u.property_id) : undefined;
    const prof = profileMap.get(l.tenant_id);
    const pmtInfo = paymentsByLease.get(l.id);

    return {
      id: l.id,
      tenantId: l.tenant_id,
      tenantName: prof?.full_name ?? "Resident",
      tenantEmail: prof?.email,
      tenantPhone: prof?.phone,
      unitId: l.unit_id,
      unitName: u?.name ?? "Unit",
      propertyId: p?.id ?? "",
      propertyName: p?.name ?? "Property",
      monthlyRent: l.monthly_rent,
      startDate: l.start_date,
      endDate: l.end_date ?? "",
      outstandingBalance: pmtInfo?.totalPending ?? 0,
      daysOverdue: pmtInfo?.maxDaysOverdue ?? 0,
      dueDate: pmtInfo?.earliestDueDate ?? "",
    };
  });

  // 7. Fetch open maintenance tickets
  let ticketQuery = supabase
    .from("maintenance_requests")
    .select("id, unit_id, tenant_id, title, description, priority, status, third_party_name, created_at, updated_at")
    .eq("landlord_id", landlordId)
    .in("status", ["pending", "open", "assigned", "in_progress"]);

  const { data: ticketsData } = await ticketQuery;
  const tickets = (ticketsData ?? []).filter((t) => {
    const u = unitMap.get(t.unit_id);
    return u && propertyIds.includes(u.property_id);
  });

  const maintenanceTicketSummaries: MaintenanceTicketSummary[] = tickets.map((t) => {
    const u = unitMap.get(t.unit_id);
    const p = u ? propMap.get(u.property_id) : undefined;
    const prof = profileMap.get(t.tenant_id);

    return {
      id: t.id,
      unitId: t.unit_id,
      unitName: u?.name ?? "Unit",
      propertyId: p?.id ?? "",
      propertyName: p?.name ?? "Property",
      tenantName: prof?.full_name ?? "Resident",
      title: t.title,
      description: t.description,
      priority: t.priority as MaintenanceTicketSummary["priority"],
      status: t.status as MaintenanceTicketSummary["status"],
      assignedTechnician: t.third_party_name,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    };
  });

  return buildOperationsContext(
    landlordId,
    propertySummaries,
    activeLeaseSummaries,
    maintenanceTicketSummaries
  );
}

export class IrisOperationsService {
  static verifyLandlordLeaseOwnership = verifyLandlordLeaseOwnership;
  static verifyLandlordPropertyOwnership = verifyLandlordPropertyOwnership;
  static getLeaseInvoiceContext = getLeaseInvoiceContext;
  static getLandlordOperationalContext = getLandlordOperationalContext;
  static generateReceiptNumber = generateReceiptNumber;
  static filterAudience = filterAudience;
  static recordQuickSettlement = recordQuickSettlement;
  static updateMaintenanceTicketStatus = updateMaintenanceTicketStatus;
  static buildOperationsContext = buildOperationsContext;
}
