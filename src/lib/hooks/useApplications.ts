"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserId } from "./useUser";
import type { Application } from "@/types/database";

interface ApplicationWithUnit extends Application {
    unit?: {
        name: string;
        rent_amount: number;
        property?: {
            name: string;
            address: string;
            images: string[];
        };
    };
}

interface ApplicationsState {
    applications: ApplicationWithUnit[];
    loading: boolean;
    error: string | null;
}

export function useApplications(role: "tenant" | "landlord") {
    const { userId, loading: userLoading } = useUserId();
    const [state, setState] = useState<ApplicationsState>({
        applications: [],
        loading: true,
        error: null,
    });

    useEffect(() => {
        if (userLoading) return;
        if (!userId) {
            setState({ applications: [], loading: false, error: null });
            return;
        }

        const supabase = createClient();

        const fetchApplications = async () => {
            try {
                const column = role === "tenant" ? "applicant_id" : "landlord_id";
                const { data, error } = await supabase
                    .from("applications")
                    .select("*, unit:units(name, rent_amount, property:properties(name, address, images))")
                    .eq(column, userId)
                    .order("created_at", { ascending: false });

                if (error) throw error;

                const mapped: ApplicationWithUnit[] = (data ?? []).map((row: any) => {
                    const unit =
                        row.unit && typeof row.unit === "object" && "name" in row.unit
                            ? (row.unit as ApplicationWithUnit["unit"])
                            : undefined;
                    return { ...row, unit } as ApplicationWithUnit;
                });
                setState({ applications: mapped, loading: false, error: null });
            } catch (err: any) {
                setState({ applications: [], loading: false, error: err.message });
            }
        };

        void fetchApplications();
    }, [userId, userLoading, role]);

    return state;
}