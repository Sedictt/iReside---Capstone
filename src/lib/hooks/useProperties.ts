"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserId } from "./useUser";
import type { Property, Unit } from "@/types/database";

interface PropertyWithUnits extends Property {
    units?: Unit[];
}

interface PropertiesState {
    properties: PropertyWithUnits[];
    loading: boolean;
    error: string | null;
}

export function useProperties() {
    const { userId, loading: userLoading } = useUserId();
    const [state, setState] = useState<PropertiesState>({
        properties: [],
        loading: true,
        error: null,
    });

    useEffect(() => {
        if (userLoading) return;
        if (!userId) {
            setState({ properties: [], loading: false, error: null });
            return;
        }

        const supabase = createClient();

        const fetchProperties = async () => {
            try {
                const { data, error } = await supabase
                    .from("properties")
                    .select("*, units(*)")
                    .eq("landlord_id", userId)
                    .order("created_at", { ascending: false });

                if (error) throw error;

                setState({ properties: data ?? [], loading: false, error: null });
            } catch (err: any) {
                setState({ properties: [], loading: false, error: err.message });
            }
        };

        void fetchProperties();
    }, [userId, userLoading]);

    return state;
}

export function usePropertyDetail(propertyId: string | null) {
    const { userId, loading: userLoading } = useUserId();
    const [state, setState] = useState<{
        property: PropertyWithUnits | null;
        loading: boolean;
        error: string | null;
    }>({ property: null, loading: true, error: null });

    useEffect(() => {
        if (userLoading) return;
        if (!propertyId || !userId) {
            setState({ property: null, loading: false, error: null });
            return;
        }

        const supabase = createClient();

        const fetchProperty = async () => {
            try {
                const { data, error } = await supabase
                    .from("properties")
                    .select("*, units(*)")
                    .eq("id", propertyId)
                    .eq("landlord_id", userId)
                    .single();

                if (error) throw error;

                setState({ property: data, loading: false, error: null });
            } catch (err: any) {
                setState({ property: null, loading: false, error: err.message });
            }
        };

        void fetchProperty();
    }, [propertyId, userId, userLoading]);

    return state;
}