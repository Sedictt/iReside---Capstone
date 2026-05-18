"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserId } from "./useUser";
import type { MaintenanceRequest } from "@/types/database";

interface MaintenanceWithUnit extends MaintenanceRequest {
    unit?: {
        name: string;
        property?: {
            name: string;
        };
    };
}

interface MaintenanceState {
    requests: MaintenanceWithUnit[];
    loading: boolean;
    error: string | null;
}

export function useMaintenanceRequests(role: "tenant" | "landlord") {
    const { userId, loading: userLoading } = useUserId();
    const [state, setState] = useState<MaintenanceState>({
        requests: [],
        loading: true,
        error: null,
    });

    useEffect(() => {
        if (userLoading) return;
        if (!userId) {
            setState({ requests: [], loading: false, error: null });
            return;
        }

        const supabase = createClient();

        const fetchRequests = async () => {
            try {
                const column = role === "tenant" ? "tenant_id" : "landlord_id";
                const { data, error } = await supabase
                    .from("maintenance_requests")
                    .select("*, unit:units(name, property:properties(name))")
                    .eq(column, userId)
                    .order("created_at", { ascending: false });

                if (error) throw error;

                const requests: MaintenanceWithUnit[] = (data ?? []).map((row: any) => {
                    const unit =
                        row.unit && typeof row.unit === "object" && "name" in row.unit
                            ? (row.unit as MaintenanceWithUnit["unit"])
                            : undefined;
                    return { ...row, unit } as MaintenanceWithUnit;
                });

                setState({ requests, loading: false, error: null });
            } catch (err: any) {
                setState({ requests: [], loading: false, error: err.message });
            }
        };

        void fetchRequests();
    }, [userId, userLoading, role]);

    return state;
}