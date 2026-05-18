"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserId } from "./useUser";
import type { Notification } from "@/types/database";

interface NotificationsState {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
}

export function useNotifications() {
    const { userId, loading: userLoading } = useUserId();
    const [state, setState] = useState<NotificationsState>({
        notifications: [],
        unreadCount: 0,
        loading: true,
        error: null,
    });

    useEffect(() => {
        if (userLoading) return;
        if (!userId) {
            setState({ notifications: [], unreadCount: 0, loading: false, error: null });
            return;
        }

        const supabase = createClient();

        const fetchNotifications = async () => {
            try {
                const { data, error } = await supabase
                    .from("notifications")
                    .select("*")
                    .eq("user_id", userId)
                    .order("created_at", { ascending: false })
                    .limit(50);

                if (error) throw error;

                const notifications = data ?? [];
                setState({
                    notifications,
                    unreadCount: notifications.filter((n) => !n.read).length,
                    loading: false,
                    error: null,
                });
            } catch (err: any) {
                setState({ notifications: [], unreadCount: 0, loading: false, error: err.message });
            }
        };

        void fetchNotifications();

        // Subscribe to real-time changes
        const channel = supabase
            .channel("notifications-channel")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    void fetchNotifications();
                }
            )
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [userId, userLoading]);

    const markAsRead = async (notificationId: string) => {
        const supabase = createClient();
        await supabase
            .from("notifications")
            .update({ read: true })
            .eq("id", notificationId);
        setState((prev) => ({
            ...prev,
            notifications: prev.notifications.map((n) =>
                n.id === notificationId ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, prev.unreadCount - 1),
        }));
    };

    const markAllAsRead = async () => {
        const supabase = createClient();
        await supabase
            .from("notifications")
            .update({ read: true })
            .eq("user_id", userId!)
            .eq("read", false);
        setState((prev) => ({
            ...prev,
            notifications: prev.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
        }));
    };

    return { ...state, markAsRead, markAllAsRead };
}