import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { NotificationType, PaymentStatus } from "@/types/database";

type LeaseSummary = {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    monthlyRent: number;
    securityDeposit: number;
    unitName: string | null;
    propertyName: string | null;
    propertyAddress: string | null;
    propertyCity: string | null;
    landlordName: string | null;
    landlordEmail: string | null;
    landlordPhone: string | null;
};

type NextPayment = {
    id: string;
    amount: number;
    dueDate: string;
    description: string | null;
};

type OverduePayment = {
    id: string;
    amount: number;
    dueDate: string;
    description: string | null;
    reference: string | null;
};

type UtilityItem = {
    label: string;
    amount: number;
};

type Announcement = {
    id: string;
    title: string;
    message: string;
    createdAt: string;
};

type ActivityItem = {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    createdAt: string;
    read: boolean;
};

type PaymentHistoryItem = {
    id: string;
    amount: number;
    dueDate: string;
    paidAt: string | null;
    status: PaymentStatus;
    description: string | null;
    category: string | null;
};

const normalizeCategory = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

const isPendingStatus = (status: PaymentStatus) => status === "pending" || status === "processing";

const buildUtilities = (
    payments: Array<{
        description: string | null;
        items: Array<{ label: string; amount: number; category: string }>;
    }>
) => {
    const totals = new Map<string, number>();

    const register = (label: string, amount: number) => {
        const current = totals.get(label) ?? 0;
        totals.set(label, current + amount);
    };

    payments.forEach((payment) => {
        payment.items?.forEach((item) => {
            const category = normalizeCategory(item.category);
            const label = normalizeCategory(item.label);

            if (category.includes("electric") || label.includes("electric")) {
                register("Electricity", Number(item.amount ?? 0));
            }
            if (category.includes("water") || label.includes("water")) {
                register("Water", Number(item.amount ?? 0));
            }
        });

        if (!payment.items || payment.items.length === 0) {
            const desc = normalizeCategory(payment.description);
            if (desc.includes("electric")) {
                register("Electricity", 0);
            }
            if (desc.includes("water")) {
                register("Water", 0);
            }
        }
    });

    return Array.from(totals.entries())
        .map(([label, amount]) => ({ label, amount }))
        .filter((item) => Number.isFinite(item.amount));
};

export async function GET() {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const nowIso = now.toISOString();

    // Parallelize all data fetching!
    const [
        { data: leaseRows, error: leaseError },
        { data: nextPayments, error: nextPaymentError },
        { data: overdueRows, error: overdueError },
        { data: utilityRows, error: utilityError },
        { data: announcementRows, error: announcementError },
        { data: activityRows, error: activityError },
        { data: paymentHistoryRows, error: paymentHistoryError }
    ] = await Promise.all([
        supabase
            .from("leases")
            .select(`
                id, status, start_date, end_date, monthly_rent, security_deposit,
                unit:units(id, name, property:properties(id, name, address, city)),
                landlord:profiles!leases_landlord_id_fkey(full_name, email, phone)
            `)
            .eq("tenant_id", user.id)
            .order("end_date", { ascending: false })
            .limit(5),
        supabase
            .from("payments")
            .select("id, amount, status, due_date, description")
            .eq("tenant_id", user.id)
            .in("status", ["pending", "processing"])
            .order("due_date", { ascending: true })
            .limit(1),
        supabase
            .from("payments")
            .select("id, amount, status, due_date, description, reference_number")
            .eq("tenant_id", user.id)
            .in("status", ["pending", "processing"])
            .lt("due_date", nowIso)
            .order("due_date", { ascending: true })
            .limit(5),
        supabase
            .from("payments")
            .select("id, description, items:payment_items(label, amount, category)")
            .eq("tenant_id", user.id)
            .order("due_date", { ascending: false })
            .limit(25),
        supabase
            .from("notifications")
            .select("id, title, message, created_at")
            .eq("user_id", user.id)
            .eq("type", "announcement")
            .order("created_at", { ascending: false })
            .limit(1),
        supabase
            .from("notifications")
            .select("id, type, title, message, read, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(6),
        supabase
            .from("payments")
            .select(`
                id, amount, due_date, paid_at, status, description,
                items:payment_items(category)
            `)
            .eq("tenant_id", user.id)
            .order("due_date", { ascending: false })
            .limit(20)
    ]);

    if (leaseError || nextPaymentError || overdueError || paymentHistoryError) {
        return NextResponse.json({ error: "Failed to load dashboard data." }, { status: 500 });
    }

    const activeLease =
        (leaseRows ?? []).find((lease) => lease.status === "active") ??
        (leaseRows ?? [])[0] ??
        null;

    let leaseSummary: LeaseSummary | null = null;
    if (activeLease && activeLease.unit) {
        // Safe access as relationship might return an array or object
        const unit = Array.isArray(activeLease.unit) ? activeLease.unit[0] : activeLease.unit;
        const property = unit?.property ? (Array.isArray(unit.property) ? unit.property[0] : unit.property) : null;
        const landlord = activeLease.landlord ? (Array.isArray(activeLease.landlord) ? activeLease.landlord[0] : activeLease.landlord) : null;

        leaseSummary = {
            id: activeLease.id,
            status: activeLease.status,
            startDate: activeLease.start_date,
            endDate: activeLease.end_date,
            monthlyRent: Number(activeLease.monthly_rent ?? 0),
            securityDeposit: Number(activeLease.security_deposit ?? 0),
            unitName: unit?.name ?? null,
            propertyName: property?.name ?? null,
            propertyAddress: property?.address ?? null,
            propertyCity: property?.city ?? null,
            landlordName: landlord?.full_name ?? null,
            landlordEmail: landlord?.email ?? null,
            landlordPhone: landlord?.phone ?? null,
        };
    }

    const nextPaymentRow = (nextPayments ?? [])[0] ?? null;
    const nextPayment: NextPayment | null = nextPaymentRow
        ? {
            id: nextPaymentRow.id,
            amount: Number(nextPaymentRow.amount ?? 0),
            dueDate: nextPaymentRow.due_date,
            description: nextPaymentRow.description ?? null,
        }
        : null;

    const overduePayments: OverduePayment[] = (overdueRows ?? [])
        .filter((row) => isPendingStatus(row.status as PaymentStatus))
        .map((row) => ({
            id: row.id,
            amount: Number(row.amount ?? 0),
            dueDate: row.due_date,
            description: row.description ?? null,
            reference: row.reference_number ?? null,
        }));

    const utilities: UtilityItem[] = utilityError
        ? []
        : buildUtilities(
            (utilityRows ?? []).map((row) => ({
                description: row.description ?? null,
                items: (row.items ?? []) as unknown as Array<{ label: string; amount: number; category: string }>,
            }))
        );

    const announcementRow = announcementError ? null : (announcementRows ?? [])[0] ?? null;
    const announcement: Announcement | null = announcementRow
        ? {
            id: announcementRow.id,
            title: announcementRow.title,
            message: announcementRow.message,
            createdAt: announcementRow.created_at,
        }
        : null;

    const recentActivity: ActivityItem[] = activityError
        ? []
        : (activityRows ?? []).map((row) => ({
            id: row.id,
            type: row.type as NotificationType,
            title: row.title,
            message: row.message,
            createdAt: row.created_at,
            read: Boolean(row.read),
        }));

    // Process payment history
    const paymentHistory: PaymentHistoryItem[] = (paymentHistoryRows ?? []).map((row) => {
        // Determine category from payment items
        const items = row.items ?? [];
        const firstItem = Array.isArray(items) && items.length > 0 ? items[0] : null;
        const category = firstItem?.category ?? null;

        return {
            id: row.id,
            amount: Number(row.amount ?? 0),
            dueDate: row.due_date,
            paidAt: row.paid_at ?? null,
            status: row.status as PaymentStatus,
            description: row.description ?? null,
            category,
        };
    });

    return NextResponse.json({
        lease: leaseSummary,
        nextPayment,
        overduePayments,
        utilities,
        announcement,
        recentActivity,
        paymentHistory,
    });
}
