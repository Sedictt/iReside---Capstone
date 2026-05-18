"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserId } from "./useUser";
import type { Payment, MaintenanceRequest, Application } from "@/types/database";

interface RevenueInfo {
    totalExpected: number;
    collected: number;
    pending: number;
}

interface LandlordMetric {
    label: string;
    value: string;
}

interface ActionItem {
    id: string;
    title: string;
    description: string;
    type: "warning" | "urgent" | "info";
    screen: string;
    params?: Record<string, string>;
}

interface LandlordDashboardData {
    revenue: RevenueInfo | null;
    metrics: LandlordMetric[];
    actionItems: ActionItem[];
    loading: boolean;
    error: string | null;
}

export function useLandlordData() {
    const { userId, loading: userLoading } = useUserId();
    const [state, setState] = useState<LandlordDashboardData>({
        revenue: null,
        metrics: [],
        actionItems: [],
        loading: true,
        error: null,
    });

    useEffect(() => {
        if (userLoading) return;
        if (!userId) {
            setState({ revenue: null, metrics: [], actionItems: [], loading: false, error: null });
            return;
        }

        const supabase = createClient();

        const fetchData = async () => {
            try {
                const [propsRes, unitsRes, paymentsRes, maintenanceRes, appsRes] = await Promise.all([
                    supabase.from("properties").select("id").eq("landlord_id", userId),
                    supabase.from("units").select("id, status, property:properties!inner(landlord_id)").eq("property.landlord_id", userId),
                    supabase.from("payments").select("*").eq("landlord_id", userId),
                    supabase.from("maintenance_requests").select("*").eq("landlord_id", userId),
                    supabase.from("applications").select("*").eq("landlord_id", userId),
                ]);

                const totalProperties = propsRes.data?.length ?? 0;
                const totalUnits = unitsRes.data?.length ?? 0;
                const occupiedUnits = unitsRes.data?.filter((u) => u.status === "occupied").length ?? 0;
                const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

                const allPayments = paymentsRes.data ?? [];
                const collected = allPayments
                    .filter((p) => p.status === "completed")
                    .reduce((sum, p) => sum + p.amount, 0);
                const pending = allPayments
                    .filter((p) => p.status === "pending" || p.status === "processing")
                    .reduce((sum, p) => sum + p.amount, 0);
                const overdue = allPayments
                    .filter((p) => p.status === "failed")
                    .reduce((sum, p) => sum + p.amount, 0);

                const actionItems: ActionItem[] = [];

                const pendingApps = appsRes.data?.filter((a) => a.status === "pending" || a.status === "reviewing") ?? [];
                if (pendingApps.length > 0) {
                    actionItems.push({
                        id: "pending-apps",
                        title: `${pendingApps.length} Pending Application${pendingApps.length > 1 ? "s" : ""}`,
                        description: "New applications need your review",
                        type: "warning",
                        screen: "activity",
                        params: { tab: "applications" },
                    });
                }

                const openMaintenance = maintenanceRes.data?.filter((m) => m.status === "open" || m.status === "in_progress") ?? [];
                if (openMaintenance.length > 0) {
                    actionItems.push({
                        id: "open-maintenance",
                        title: `${openMaintenance.length} Maintenance Request${openMaintenance.length > 1 ? "s" : ""}`,
                        description: openMaintenance[0]?.title ?? "Open maintenance requests",
                        type: "urgent",
                        screen: "activity",
                        params: { tab: "maintenance" },
                    });
                }

                const overduePayments = allPayments.filter((p) => p.status === "failed" || p.status === "pending");
                if (overduePayments.length > 0) {
                    actionItems.push({
                        id: "overdue-payments",
                        title: `${overduePayments.length} Overdue Payment${overduePayments.length > 1 ? "s" : ""}`,
                        description: `Totaling ₱${(overdue + pending).toLocaleString()}`,
                        type: "info",
                        screen: "activity",
                        params: { tab: "invoices" },
                    });
                }

                setState({
                    revenue: totalProperties > 0 ? { totalExpected: collected + pending + overdue, collected, pending } : null,
                    metrics: [
                        { label: "Total Units", value: String(totalUnits) },
                        { label: "Occupancy Rate", value: `${occupancyRate}%` },
                    ],
                    actionItems,
                    loading: false,
                    error: null,
                });
            } catch (err: any) {
                setState({ revenue: null, metrics: [], actionItems: [], loading: false, error: err.message });
            }
        };

        void fetchData();
    }, [userId, userLoading]);

    return state;
}