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

    const { data: leaseRows, error: leaseError } = await supabase
        .from("leases")
        .select("id, unit_id, landlord_id, status, start_date, end_date, monthly_rent, security_deposit")
        .eq("tenant_id", user.id)
        .order("end_date", { ascending: false })
        .limit(5);

    if (leaseError) {
        return NextResponse.json({ error: "Failed to load lease data." }, { status: 500 });
    }

    const activeLease =
        (leaseRows ?? []).find((lease) => lease.status === "active") ??
        (leaseRows ?? [])[0] ??
        null;

    let leaseSummary: LeaseSummary | null = null;
    if (activeLease) {
        const { data: unitRow } = await supabase
            .from("units")
            .select("id, name, property_id")
            .eq("id", activeLease.unit_id)
            .maybeSingle();

        const { data: propertyRow } = unitRow?.property_id
            ? await supabase
                .from("properties")
                .select("id, name, address, city")
                .eq("id", unitRow.property_id)
                .maybeSingle()
            : { data: null };

        leaseSummary = {
            id: activeLease.id,
            status: activeLease.status,
            startDate: activeLease.start_date,
            endDate: activeLease.end_date,
            monthlyRent: Number(activeLease.monthly_rent ?? 0),
            securityDeposit: Number(activeLease.security_deposit ?? 0),
            unitName: unitRow?.name ?? null,
            propertyName: propertyRow?.name ?? null,
            propertyAddress: propertyRow?.address ?? null,
            propertyCity: propertyRow?.city ?? null,
        };
    }

    const { data: nextPayments, error: nextPaymentError } = await supabase
        .from("payments")
        .select("id, amount, status, due_date, description")
        .eq("tenant_id", user.id)
        .in("status", ["pending", "processing"])
        .order("due_date", { ascending: true })
        .limit(1);

    if (nextPaymentError) {
        return NextResponse.json({ error: "Failed to load next payment." }, { status: 500 });
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

    const { data: overdueRows, error: overdueError } = await supabase
        .from("payments")
        .select("id, amount, status, due_date, description, reference_number")
        .eq("tenant_id", user.id)
        .in("status", ["pending", "processing"])
        .lt("due_date", nowIso)
        .order("due_date", { ascending: true })
        .limit(5);

    if (overdueError) {
        return NextResponse.json({ error: "Failed to load overdue payments." }, { status: 500 });
    }

    const overduePayments: OverduePayment[] = (overdueRows ?? [])
        .filter((row) => isPendingStatus(row.status))
        .map((row) => ({
            id: row.id,
            amount: Number(row.amount ?? 0),
            dueDate: row.due_date,
            description: row.description ?? null,
            reference: row.reference_number ?? null,
        }));

    const { data: utilityRows, error: utilityError } = await supabase
        .from("payments")
        .select("id, description, items:payment_items(label, amount, category)")
        .eq("tenant_id", user.id)
        .order("due_date", { ascending: false })
        .limit(25);

    const utilities: UtilityItem[] = utilityError
        ? []
        : buildUtilities(
            (utilityRows ?? []).map((row) => ({
                description: row.description ?? null,
                items: (row.items ?? []) as Array<{ label: string; amount: number; category: string }>,
            }))
        );

    const { data: announcementRows, error: announcementError } = await supabase
        .from("notifications")
        .select("id, title, message, created_at")
        .eq("user_id", user.id)
        .eq("type", "announcement")
        .order("created_at", { ascending: false })
        .limit(1);

    const announcementRow = announcementError ? null : (announcementRows ?? [])[0] ?? null;
    const announcement: Announcement | null = announcementRow
        ? {
            id: announcementRow.id,
            title: announcementRow.title,
            message: announcementRow.message,
            createdAt: announcementRow.created_at,
        }
        : null;

    const { data: activityRows, error: activityError } = await supabase
        .from("notifications")
        .select("id, type, title, message, read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6);

    const recentActivity: ActivityItem[] = activityError
        ? []
        : (activityRows ?? []).map((row) => ({
            id: row.id,
            type: row.type,
            title: row.title,
            message: row.message,
            createdAt: row.created_at,
            read: Boolean(row.read),
        }));

    return NextResponse.json({
        lease: leaseSummary,
        nextPayment,
        overduePayments,
        utilities,
        announcement,
        recentActivity,
    });
}
