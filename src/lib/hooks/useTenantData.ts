"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserId } from "./useUser";
import type { Lease, Payment } from "@/types/database";

interface ActiveLease extends Lease {
    unit?: {
        name: string;
        rent_amount: number;
        property?: {
            name: string;
            address: string;
        };
    };
}

interface RentInfo {
    amount: number;
    dueDate: string;
    status: "paid" | "due" | "overdue";
}

interface TenantHomeData {
    lease: ActiveLease | null;
    rent: RentInfo | null;
    recentPayments: Payment[];
    loading: boolean;
    error: string | null;
}

export function useTenantData() {
    const { userId, loading: userLoading } = useUserId();
    const [state, setState] = useState<TenantHomeData>({
        lease: null,
        rent: null,
        recentPayments: [],
        loading: true,
        error: null,
    });

    useEffect(() => {
        if (userLoading) return;
        if (!userId) {
            setState({ lease: null, rent: null, recentPayments: [], loading: false, error: null });
            return;
        }

        const supabase = createClient();

        const fetchData = async () => {
            try {
                const { data: leases, error: leaseError } = await supabase
                    .from("leases")
                    .select("*, unit:units(name, rent_amount, property:properties(name, address))")
                    .eq("tenant_id", userId)
                    .in("status", ["active", "pending_signature", "pending_tenant_signature", "pending_landlord_signature"])
                    .order("created_at", { ascending: false })
                    .limit(1);

                if (leaseError) throw leaseError;

                const activeLease: ActiveLease | null = leases?.[0] ?? null;

                let rent: RentInfo | null = null;
                if (activeLease) {
                    const today = new Date();
                    const currentMonth = today.toISOString().slice(0, 7);

                    const { data: payments } = await supabase
                        .from("payments")
                        .select("*")
                        .eq("lease_id", activeLease.id)
                        .gte("due_date", `${currentMonth}-01`)
                        .lte("due_date", `${currentMonth}-31`)
                        .limit(1);

                    const currentPayment = payments?.[0];
                    const dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                    const formattedDue = dueDate.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                    });

                    if (currentPayment) {
                        rent = {
                            amount: currentPayment.amount,
                            dueDate: currentPayment.due_date,
                            status: currentPayment.status === "completed"
                                ? "paid"
                                : today > new Date(currentPayment.due_date)
                                    ? "overdue"
                                    : "due",
                        };
                    } else {
                        rent = {
                            amount: activeLease.monthly_rent,
                            dueDate: formattedDue,
                            status: "due",
                        };
                    }
                }

                const { data: payments } = await supabase
                    .from("payments")
                    .select("*")
                    .eq("tenant_id", userId)
                    .order("due_date", { ascending: false })
                    .limit(5);

                setState({
                    lease: activeLease,
                    rent,
                    recentPayments: payments ?? [],
                    loading: false,
                    error: null,
                });
            } catch (err: any) {
                setState({ lease: null, rent: null, recentPayments: [], loading: false, error: err.message });
            }
        };

        void fetchData();
    }, [userId, userLoading]);

    return state;
}