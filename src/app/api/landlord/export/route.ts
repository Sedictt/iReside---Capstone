import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { listLandlordInvoices, type InvoiceListItem } from "@/lib/billing/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;
    const admin = createServiceRoleSupabaseClient();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "financials";
    const range = searchParams.get("range") || "ytd"; // ytd | 12m | all

    try {
        if (category === "properties") {
            const { data: properties, error: propErr } = await supabase
                .from("properties")
                .select("id, name, address, type, total_units")
                .eq("landlord_id", userId)
                .order("name", { ascending: true });

            if (propErr) throw propErr;

            const propIds = (properties ?? []).map((p) => p.id);
            let units: Array<{ id: string; property_id: string; status: string | null; rent_amount: number | null }> = [];
            if (propIds.length > 0) {
                const { data: unitRows, error: unitErr } = await supabase
                    .from("units")
                    .select("id, property_id, status, rent_amount")
                    .in("property_id", propIds);
                if (unitErr) throw unitErr;
                units = (unitRows as typeof units) ?? [];
            }

            const rows = (properties ?? []).map((prop) => {
                const propUnits = units.filter((u) => u.property_id === prop.id);
                const occupied = propUnits.filter((u) => (u.status ?? "").toLowerCase() === "occupied").length;
                const total = Math.max(propUnits.length, Number(prop.total_units) || 0, occupied, 1);
                const vacant = Math.max(0, total - occupied);
                const rate = Math.min(100, Math.round((occupied / total) * 100));

                return {
                    "Property Name": prop.name,
                    "Property Type": prop.type || "Apartment",
                    "Address": prop.address || "N/A",
                    "Total Units": total,
                    "Occupied Units": occupied,
                    "Vacant Units": vacant,
                    "Occupancy Rate": `${rate}%`,
                };
            });

            return NextResponse.json({
                category: "properties",
                count: rows.length,
                data: rows,
                filename: `iReside_Portfolio_Inventory_${new Date().toISOString().split("T")[0]}`,
            });
        }

        if (category === "financials") {
            const invoiceResult = await listLandlordInvoices(supabase, userId);
            const allInvoices: InvoiceListItem[] = invoiceResult?.invoices ?? [];

            const now = new Date();
            const currentYear = now.getFullYear();
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(now.getFullYear() - 1);

            const filtered = allInvoices.filter((inv: InvoiceListItem) => {
                if (range === "all") return true;
                const date = new Date(inv.issuedDate || inv.dueDate);
                if (isNaN(date.getTime())) return true;
                if (range === "ytd") {
                    return date.getFullYear() === currentYear;
                }
                if (range === "12m") {
                    return date >= oneYearAgo;
                }
                return true;
            });

            const rows = filtered.map((inv: InvoiceListItem) => {
                const total = Number(inv.amount) || 0;
                const balance = Number(inv.balanceRemaining) || 0;
                const paid = Math.max(0, total - balance);

                return {
                    "Invoice Number": inv.invoiceNumber,
                    "Issue Date": inv.issuedDate || "N/A",
                    "Due Date": inv.dueDate || "N/A",
                    "Property": inv.property || "N/A",
                    "Unit": inv.unit || "N/A",
                    "Tenant Name": inv.tenant || "N/A",
                    "Total Amount (PHP)": total,
                    "Amount Paid (PHP)": paid,
                    "Balance Remaining (PHP)": balance,
                    "Status": inv.status || "pending",
                    "Billing Type": inv.type || "Rent",
                    "Payment Method": inv.paymentMethod || "N/A",
                };
            });

            return NextResponse.json({
                category: "financials",
                range,
                count: rows.length,
                data: rows,
                filename: `iReside_Financials_${range.toUpperCase()}_${new Date().toISOString().split("T")[0]}`,
            });
        }

        if (category === "rent_roll") {
            const { data: leases, error: leaseErr } = await admin
                .from("leases")
                .select(`
                    id,
                    status,
                    start_date,
                    end_date,
                    monthly_rent,
                    security_deposit,
                    tenant:tenant_id(id, full_name, email),
                    unit:unit_id(id, name, property:property_id(id, name))
                `)
                .eq("landlord_id", userId)
                .in("status", ["active", "pending_signature", "pending_tenant_signature", "pending_landlord_signature"])
                .order("start_date", { ascending: false });

            if (leaseErr) throw leaseErr;

            interface LeaseRow {
                unit?: { name?: string; property?: { name?: string } | null } | null;
                tenant?: { full_name?: string; email?: string } | null;
                monthly_rent?: number | null;
                security_deposit?: number | null;
                start_date?: string | null;
                end_date?: string | null;
                status?: string | null;
            }

            const rows = ((leases as unknown as LeaseRow[]) ?? []).map((l) => ({
                "Property": l.unit?.property?.name || "N/A",
                "Unit": l.unit?.name || "N/A",
                "Tenant Name": l.tenant?.full_name || "N/A",
                "Tenant Email": l.tenant?.email || "N/A",
                "Monthly Rent (PHP)": Number(l.monthly_rent) || 0,
                "Security Deposit (PHP)": Number(l.security_deposit) || 0,
                "Lease Start Date": l.start_date || "N/A",
                "Lease End Date": l.end_date || "N/A",
                "Lease Status": l.status || "Active",
            }));

            return NextResponse.json({
                category: "rent_roll",
                count: rows.length,
                data: rows,
                filename: `iReside_Rent_Roll_${new Date().toISOString().split("T")[0]}`,
            });
        }

        return NextResponse.json({ error: "Invalid export category." }, { status: 400 });
    } catch (error) {
        console.error("Failed to generate data export:", error);
        return NextResponse.json({ error: "Failed to generate export." }, { status: 500 });
    }
}
