"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserId } from "./useUser";
import type { Payment } from "@/types/database";

interface PaymentsState {
    upcoming: Payment[];
    history: Payment[];
    totalDue: number;
    loading: boolean;
    error: string | null;
}

export function usePayments(role: "tenant" | "landlord") {
    const { userId, loading: userLoading } = useUserId();
    const [state, setState] = useState<PaymentsState>({
        upcoming: [],
        history: [],
        totalDue: 0,
        loading: true,
        error: null,
    });

    useEffect(() => {
        if (userLoading) return;
        if (!userId) {
            setState({ upcoming: [], history: [], totalDue: 0, loading: false, error: null });
            return;
        }

        const supabase = createClient();

        const fetchPayments = async () => {
            try {
                const column = role === "tenant" ? "tenant_id" : "landlord_id";
                const { data, error } = await supabase
                    .from("payments")
                    .select("*")
                    .eq(column, userId)
                    .order("due_date", { ascending: false });

                if (error) throw error;

                const payments = data ?? [];
                const now = new Date();

                const upcoming = payments.filter(
                    (p) => p.status === "pending" || p.status === "processing"
                );
                const history = payments.filter(
                    (p) => p.status === "completed" || p.status === "failed" || p.status === "refunded"
                );
                const totalDue = upcoming.reduce((sum, p) => sum + p.amount, 0);

                setState({ upcoming, history, totalDue, loading: false, error: null });
            } catch (err: any) {
                setState({ upcoming: [], history: [], totalDue: 0, loading: false, error: err.message });
            }
        };

        void fetchPayments();
    }, [userId, userLoading, role]);

    return state;
}