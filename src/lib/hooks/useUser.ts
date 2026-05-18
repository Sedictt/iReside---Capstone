"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

interface UserState {
    user: Profile | null;
    loading: boolean;
    error: string | null;
}

export function useUser() {
    const [state, setState] = useState<UserState>({
        user: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        const supabase = createClient();

        const fetchUser = async () => {
            try {
                const { data: authData, error: authError } = await supabase.auth.getUser();
                if (authError || !authData?.user) {
                    setState({ user: null, loading: false, error: null });
                    return;
                }

                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", authData.user.id)
                    .single();

                if (profileError && profileError.code !== "PGRST116") {
                    setState({ user: null, loading: false, error: profileError.message });
                    return;
                }

                setState({
                    user: profile ?? {
                        id: authData.user.id,
                        email: authData.user.email ?? "",
                        full_name: authData.user.user_metadata?.full_name ?? "User",
                        role: (authData.user.user_metadata?.role as any) ?? "tenant",
                        avatar_url: null,
                        phone: null,
                        created_at: authData.user.created_at ?? new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    },
                    loading: false,
                    error: null,
                });
            } catch (err: any) {
                setState({ user: null, loading: false, error: err.message });
            }
        };

        void fetchUser();
    }, []);

    return state;
}

/**
 * Returns the user ID regardless of whether the profile exists in the database.
 * Falls back to the auth user's ID if no profile row is found.
 */
export function useUserId(): { userId: string | null; loading: boolean } {
    const { user, loading } = useUser();
    return { userId: user?.id ?? null, loading };
}