"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOptionalProperty } from "@/context/PropertyContext";
import type { Notification, NotificationType } from "@/types/database";
import { playSound } from "@/hooks/useSound";

interface NotificationContextType {
    notifications: Notification[];
    importantNotifications: Notification[];
    unreadCount: number;
    urgentCount: number;
    loading: boolean;
    error: string | null;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
    counts: {
        applications: number;
        maintenance: number;
        messages: number;
    };
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user, profile } = useAuth();
    const propertyContext = useOptionalProperty();
    const selectedPropertyId = propertyContext?.selectedPropertyId ?? "all";
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [importantNotifications, setImportantNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [urgentCount, setUrgentCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [counts, setCounts] = useState({
        applications: 0,
        maintenance: 0,
        messages: 0,
    });

    const supabase = createClient();

    const fetchCounts = useCallback(async () => {
        if (!user || !profile) return;

        try {
            if (profile.role === "landlord") {
                let propertyUnitIds: string[] | null = null;

                if (selectedPropertyId !== "all") {
                    const { data: propertyUnits, error: propertyUnitsError } = await supabase
                        .from("units")
                        .select("id")
                        .eq("property_id", selectedPropertyId);

                    if (propertyUnitsError) {
                        console.error("Error fetching property units for notifications:", propertyUnitsError);
                        return;
                    }

                    propertyUnitIds = (propertyUnits ?? [])
                        .map((unit) => unit.id)
                        .filter((id): id is string => Boolean(id));
                }

                // Fetch pending applications count
                let applicationsQuery = supabase
                    .from("applications")
                    .select("*", { count: "exact", head: true })
                    .eq("landlord_id", user.id)
                    .eq("status", "pending");

                if (propertyUnitIds) {
                    if (propertyUnitIds.length === 0) {
                        applicationsQuery = applicationsQuery.eq("unit_id", "__none__");
                    } else {
                        applicationsQuery = applicationsQuery.in("unit_id", propertyUnitIds);
                    }
                }

                const { count: appCount } = await applicationsQuery;

                // Fetch open/assigned maintenance requests count
                let maintenanceQuery = supabase
                    .from("maintenance_requests")
                    .select("*", { count: "exact", head: true })
                    .eq("landlord_id", user.id)
                    .in("status", ["open", "assigned", "in_progress"]);

                if (propertyUnitIds) {
                    if (propertyUnitIds.length === 0) {
                        maintenanceQuery = maintenanceQuery.eq("unit_id", "__none__");
                    } else {
                        maintenanceQuery = maintenanceQuery.in("unit_id", propertyUnitIds);
                    }
                }

                const { count: maintCount } = await maintenanceQuery;

                // Fetch unread messages count (simplified: messages sent to user that are not read)
                // This might need a more complex query depending on conversation participants
                const { count: msgCount } = await supabase
                    .from("messages")
                    .select("*", { count: "exact", head: true })
                    .neq("sender_id", user.id)
                    .is("read_at", null);

                setCounts({
                    applications: appCount || 0,
                    maintenance: maintCount || 0,
                    messages: msgCount || 0,
                });
            } else if (profile.role === "tenant") {
                 // Fetch unread messages count
                 const { count: msgCount } = await supabase
                    .from("messages")
                    .select("*", { count: "exact", head: true })
                    .neq("sender_id", user.id)
                    .is("read_at", null);

                setCounts(prev => ({
                    ...prev,
                    messages: msgCount || 0,
                }));
            }
        } catch (err) {
            console.error("Error fetching counts:", err);
        }
    }, [user, profile, selectedPropertyId, supabase]);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(50);

            let finalData = data || [];

            // Support preview mode for UI testing
            if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview_notifications') === 'true') {
                const mockNotifications: Notification[] = [
                    {
                        id: 'mock-1',
                        user_id: user.id,
                        type: 'lease',
                        title: 'Lease Agreement Ready',
                        message: 'Your lease agreement for Unit 402 is ready for countersignature.',
                        read: false,
                        created_at: new Date().toISOString(),
                        data: { leaseId: 'mock-lease' }
                    },
                    {
                        id: 'mock-2',
                        user_id: user.id,
                        type: 'payment',
                        title: 'Urgent: Payment Failed',
                        message: 'The security deposit payment for the new application has been rejected.',
                        read: false,
                        created_at: new Date().toISOString(),
                        data: { paymentId: 'mock-payment' }
                    },
                    {
                        id: 'mock-3',
                        user_id: user.id,
                        type: 'maintenance',
                        title: 'Urgent Maintenance',
                        message: 'Emergency plumbing request reported in Property Alpha, Unit 101.',
                        read: false,
                        created_at: new Date().toISOString(),
                        data: { maintenanceId: 'mock-maint' }
                    }
                ];
                finalData = [...mockNotifications, ...finalData];
            }

            const unread = finalData.filter(n => !n.read);
            setNotifications(finalData);
            setUnreadCount(unread.length);
            
            // Define what counts as an "important" notification
            const importantTypes: NotificationType[] = [
                'lease', 
                'lease_renewal_request', 
                'payment', 
                'maintenance',
                'application'
            ];
            
            const important = unread.filter(n => importantTypes.includes(n.type));
            setImportantNotifications(important);
            setUrgentCount(important.length);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch notifications");
        } finally {
            setLoading(false);
        }
    }, [user, supabase]);

    const refresh = useCallback(async () => {
        await Promise.all([fetchNotifications(), fetchCounts()]);
    }, [fetchNotifications, fetchCounts]);

    const markAsRead = async (id: string) => {
        try {
            const { error } = await supabase
                .from("notifications")
                .update({ read: true })
                .eq("id", id);

            if (error) throw error;

            setNotifications(prev =>
                prev.map(n => (n.id === id ? { ...n, read: true } : n))
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Error marking notification as read:", err);
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from("notifications")
                .update({ read: true })
                .eq("user_id", user.id)
                .eq("read", false);

            if (error) throw error;

            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Error marking all notifications as read:", err);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            const { error } = await supabase
                .from("notifications")
                .delete()
                .eq("id", id);

            if (error) throw error;

            setNotifications(prev => {
                const filtered = prev.filter(n => n.id !== id);
                const wasUnread = prev.find(n => n.id === id && !n.read);
                if (wasUnread) setUnreadCount(c => Math.max(0, c - 1));
                return filtered;
            });
        } catch (err) {
            console.error("Error deleting notification:", err);
        }
    };

    // eslint-disable-next-line react-doctor/effect-needs-cleanup
    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return () => {};
        }

        void refresh();

        // Subscribe to notifications
        const notificationSubscription = supabase
            .channel(`public:notifications:user_id=eq.${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    console.log("Realtime notification change:", payload);
                    if (payload.eventType === "INSERT") {
                        const newNotification = payload.new as Notification;
                        setNotifications(prev => [newNotification, ...prev]);
                        if (!newNotification.read) {
                            setUnreadCount(prev => prev + 1);
                            if (newNotification.type === "message") {
                                playSound("message");
                            } else {
                                playSound("notification");
                            }
                        }
                    } else if (payload.eventType === "UPDATE") {
                        const updatedNotification = payload.new as Notification;
                        setNotifications(prev =>
                            prev.map(n => (n.id === updatedNotification.id ? updatedNotification : n))
                        );
                        // Recalculate unread count
                        fetchNotifications();
                    } else if (payload.eventType === "DELETE") {
                        setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
                        fetchNotifications();
                    }
                }
            )
            .subscribe();

        // Subscribe to applications (if landlord)
        let applicationSubscription: any;
        if (profile?.role === "landlord") {
            applicationSubscription = supabase
                .channel(`public:applications:landlord_id=eq.${user.id}`)
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "applications",
                        filter: `landlord_id=eq.${user.id}`,
                    },
                    () => {
                        void fetchCounts();
                    }
                )
                .subscribe();
        }

        // Subscribe to maintenance requests
        const maintenanceSubscription = supabase
            .channel(`public:maintenance:landlord_id=eq.${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "maintenance_requests",
                    filter: profile?.role === "landlord" 
                        ? `landlord_id=eq.${user.id}` 
                        : `tenant_id=eq.${user.id}`,
                },
                () => {
                    void fetchCounts();
                }
            )
            .subscribe();

        // Subscribe to messages
        const messageSubscription = supabase
            .channel(`public:messages`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "messages",
                },
                () => {
                    // This is a bit broad, but messages are filtered by sender_id and read_at in fetchCounts
                    void fetchCounts();
                }
            )
            .subscribe();

        return () => {
            void supabase.removeChannel(notificationSubscription);
            if (applicationSubscription) void supabase.removeChannel(applicationSubscription);
            void supabase.removeChannel(maintenanceSubscription);
            void supabase.removeChannel(messageSubscription);
        };
    }, [user, profile, supabase, refresh, fetchCounts, fetchNotifications]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                importantNotifications,
                unreadCount,
                urgentCount,
                loading,
                error,
                markAsRead,
                markAllAsRead,
                deleteNotification,
                refresh,
                counts,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
}
