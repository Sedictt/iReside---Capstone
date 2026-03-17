import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type PaymentCategory = "Overdue" | "Near Due" | "Paid";

type PaymentItem = {
    id: string;
    tenant: string;
    unit: string;
    amount: number;
    date: string;
    avatar: string | null;
    status: PaymentCategory;
};

const formatDate = (value: string | null) => {
    if (!value) return "No date";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "No date";

    return parsed.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

const getPaymentCategory = (payment: {
    status: string;
    due_date: string;
    paid_at: string | null;
}): PaymentCategory | null => {
    const now = new Date();
    const dueDate = new Date(payment.due_date);

    if (payment.status === "completed") {
        return "Paid";
    }

    if (payment.status !== "pending" && payment.status !== "processing") {
        return null;
    }

    if (dueDate < now) {
        return "Overdue";
    }

    const diffMs = dueDate.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays <= 7) {
        return "Near Due";
    }

    return null;
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

    const { data: paymentRows, error } = await supabase
        .from("payments")
        .select("id, amount, status, due_date, paid_at, tenant_id, lease_id")
        .eq("landlord_id", user.id)
        .order("due_date", { ascending: true })
        .limit(200);

    if (error) {
        return NextResponse.json({ error: "Failed to fetch payment overview." }, { status: 500 });
    }

    const tenantIds = Array.from(
        new Set((paymentRows ?? []).map((row) => row.tenant_id).filter((value): value is string => Boolean(value)))
    );
    const leaseIds = Array.from(
        new Set((paymentRows ?? []).map((row) => row.lease_id).filter((value): value is string => Boolean(value)))
    );

    const { data: tenantRows, error: tenantsError } =
        tenantIds.length > 0
            ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", tenantIds)
            : { data: [], error: null };

    if (tenantsError) {
        return NextResponse.json({ error: "Failed to fetch tenant profiles." }, { status: 500 });
    }

    const { data: leaseRows, error: leasesError } =
        leaseIds.length > 0
            ? await supabase.from("leases").select("id, unit_id").in("id", leaseIds)
            : { data: [], error: null };

    if (leasesError) {
        return NextResponse.json({ error: "Failed to fetch leases." }, { status: 500 });
    }

    const unitIds = Array.from(
        new Set((leaseRows ?? []).map((row) => row.unit_id).filter((value): value is string => Boolean(value)))
    );

    const { data: unitRows, error: unitsError } =
        unitIds.length > 0
            ? await supabase.from("units").select("id, name").in("id", unitIds)
            : { data: [], error: null };

    if (unitsError) {
        return NextResponse.json({ error: "Failed to fetch units." }, { status: 500 });
    }

    const tenantMap = new Map((tenantRows ?? []).map((row) => [row.id, row]));
    const leaseMap = new Map((leaseRows ?? []).map((row) => [row.id, row]));
    const unitMap = new Map((unitRows ?? []).map((row) => [row.id, row]));

    const grouped: Record<PaymentCategory, PaymentItem[]> = {
        Overdue: [],
        "Near Due": [],
        Paid: [],
    };

    (paymentRows ?? []).forEach((row) => {
        const category = getPaymentCategory({
            status: row.status,
            due_date: row.due_date,
            paid_at: row.paid_at,
        });

        if (!category) {
            return;
        }

        const tenant = tenantMap.get(row.tenant_id);
        const lease = leaseMap.get(row.lease_id);
        const unit = lease ? unitMap.get(lease.unit_id) : null;

        const unitName = unit?.name ?? "Unknown unit";
        const tenantName = tenant?.full_name ?? "Unknown tenant";

        grouped[category].push({
            id: row.id,
            tenant: tenantName,
            unit: unitName,
            amount: Number(row.amount ?? 0),
            date: formatDate(category === "Paid" ? row.paid_at : row.due_date),
            avatar: tenant?.avatar_url ?? null,
            status: category,
        });
    });

    grouped.Overdue.sort((a, b) => (a.date > b.date ? -1 : 1));
    grouped["Near Due"].sort((a, b) => (a.date > b.date ? 1 : -1));

    return NextResponse.json({ payments: grouped });
}
