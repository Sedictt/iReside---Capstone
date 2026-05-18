"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserId } from "./useUser";
import type { Lease } from "@/types/database";

interface LeaseWithUnit extends Lease {
    unit?: {
        name: string;
        rent_amount: number;
        property?: {
            name: string;
            address: string;
        };
    };
}

interface LeasesState {
    leases: LeaseWithUnit[];
    activeLease: LeaseWithUnit | null;
    loading: boolean;
    error: string | null;
}

export function useLeases() {
    const { userId, loading: userLoading } = useUserId();
    const [state, setState] = useState<LeasesState>({
        leases: [],
        activeLease: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        if (userLoading) return;
        if (!userId) {
            setState({ leases: [], activeLease: null, loading: false, error: null });
            return;
        }

        const supabase = createClient();

        const fetchLeases = async () => {
            try {
                const { data, error } = await supabase
                    .from("leases")
                    .select("*, unit:units(name, rent_amount, property:properties(name, address))")
                    .eq("tenant_id", userId)
                    .order("created_at", { ascending: false });

                if (error) throw error;

                const leases: LeaseWithUnit[] = (data ?? []).map((row: any) => {
                    const unit =
                        row.unit && typeof row.unit === "object" && "name" in row.unit
                            ? (row.unit as LeaseWithUnit["unit"])
                            : undefined;
                    return { ...row, unit } as LeaseWithUnit;
                });
                const activeStatuses: Lease["status"][] = ["active", "pending_signature", "pending_tenant_signature", "pending_landlord_signature"];
                const activeLease = leases.find((l) => activeStatuses.includes(l.status)) ?? null;

                setState({ leases, activeLease, loading: false, error: null });
            } catch (err: any) {
                setState({ leases: [], activeLease: null, loading: false, error: err.message });
            }
        };

        void fetchLeases();
    }, [userId, userLoading]);

    return state;
}