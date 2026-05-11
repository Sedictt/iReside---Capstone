"use client";

import React, { createContext, useContext, useEffect, useReducer, useCallback } from "react";
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

type NotificationState = {
    notifications: Notification[];
    importantNotifications: Notification[];
    unreadCount: number;
    urgentCount: number;
    loading: boolean;
    error: string | null;
    counts: {
        applications: number;
        maintenance: number;
        messages: number;
    };
};

type NotificationAction =
    | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
    | { type: 'SET_IMPORTANT_NOTIFICATIONS'; payload: Notification[] }
    | { type: 'SET_UNREAD_COUNT'; payload: number }
    | { type: 'SET_URGENT_COUNT'; payload: number }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_COUNTS'; payload: { applications: number; maintenance: number; messages: number } }
    | { type: 'RESET_STATE' }
    | { type: 'MARK_AS_READ'; payload: string }
    | { type: 'MARK_ALL_AS_READ' }
    | { type: 'DELETE_NOTIFICATION'; payload: string }
    | { type: 'ADD_NOTIFICATION'; payload: Notification }
    | { type: 'UPDATE_NOTIFICATION'; payload: Notification }
    | { type: 'REMOVE_NOTIFICATION'; payload: string };

function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
    switch (action.type) {
        case 'SET_NOTIFICATIONS':
            return { ...state, notifications: action.payload };
        case 'SET_IMPORTANT_NOTIFICATIONS':
            return { ...state, importantNotifications: action.payload };
        case 'SET_UNREAD_COUNT':
            return { ...state, unreadCount: action.payload };
        case 'SET_URGENT_COUNT':
            return { ...state, urgentCount: action.payload };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'SET_COUNTS':
            return { ...state, counts: action.payload };
        case 'RESET_STATE':
            return {
                notifications: [],
                importantNotifications: [],
                unreadCount: 0,
                urgentCount: 0,
                loading: false,
                error: null,
                counts: { applications: 0, maintenance: 0, messages: 0 },
            };
        case 'MARK_AS_READ':
            return {
                ...state,
                notifications: state.notifications.map(n =>
                    n.id === action.payload ? { ...n, read: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1),
            };
        case 'MARK_ALL_AS_READ':
            return {
                ...state,
                notifications: state.notifications.map(n => ({ ...n, read: true })),
                unreadCount: 0,
            };
        case 'DELETE_NOTIFICATION':
            const wasUnread = state.notifications.find(n => n.id === action.payload && !n.read);
            return {
                ...state,
                notifications: state.notifications.filter(n => n.id !== action.payload),
                unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
            };
        case 'ADD_NOTIFICATION':
            return {
                ...state,
                notifications: [action.payload, ...state.notifications],
                unreadCount: action.payload.read ? state.unreadCount : state.unreadCount + 1,
            };
        case 'UPDATE_NOTIFICATION':
            return {
                ...state,
                notifications: state.notifications.map(n =>
                    n.id === action.payload.id ? action.payload : n
                ),
            };
        case 'REMOVE_NOTIFICATION':
            return {
                ...state,
                notifications: state.notifications.filter(n => n.id !== action.payload),
            };
        default:
            return state;
    }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user, profile } = useAuth();
    const propertyContext = useOptionalProperty();
    const selectedPropertyId = propertyContext?.selectedPropertyId ?? "all";

    const [state, dispatch] = useReducer(notificationReducer, {
        notifications: [],
        importantNotifications: [],
        unreadCount: 0,
        urgentCount: 0,
        loading: true,
        error: null,
        counts: {
            applications: 0,
            maintenance: 0,
            messages: 0,
        },
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

                dispatch({
                    type: 'SET_COUNTS',
                    payload: {
                        applications: appCount || 0,
                        maintenance: maintCount || 0,
                        messages: msgCount || 0,
                    },
                });
            } else if (profile.role === "tenant") {
                 // Fetch unread messages count
                 const { count: msgCount } = await supabase
                    .from("messages")
                    .select("*", { count: "exact", head: true })
                    .neq("sender_id", user.id)
                    .is("read_at", null);

                dispatch({
                    type: 'SET_COUNTS',
                    payload: {
                        ...state.counts,
                        messages: msgCount || 0,
                    },
                });
            }
        } catch (err) {
            console.error("Error fetching counts:", err);
        }
    }, [user, profile, selectedPropertyId, supabase, state.counts]);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;

        dispatch({ type: 'SET_LOADING', payload: true });
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
            
            // Define what counts as an "important" notification
            const importantTypes: NotificationType[] = [
                'lease', 
                'lease_renewal_request', 
                'payment', 
                'maintenance',
                'application'
            ];
            
            const important = unread.filter(n => importantTypes.includes(n.type));

            // Batch all state updates
            dispatch({ type: 'SET_NOTIFICATIONS', payload: finalData });
            dispatch({ type: 'SET_UNREAD_COUNT', payload: unread.length });
            dispatch({ type: 'SET_IMPORTANT_NOTIFICATIONS', payload: important });
            dispatch({ type: 'SET_URGENT_COUNT', payload: important.length });
        } catch (err) {
            dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : "Failed to fetch notifications" });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
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

            dispatch({ type: 'MARK_AS_READ', payload: id });
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

            dispatch({ type: 'MARK_ALL_AS_READ' });
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

            dispatch({ type: 'DELETE_NOTIFICATION', payload: id });
        } catch (err) {
            console.error("Error deleting notification:", err);
        }
    };

    // eslint-disable-next-line react-doctor/effect-needs-cleanup
    useEffect(() => {
        if (!user) {
            dispatch({ type: 'RESET_STATE' });
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
                        dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
                        if (!newNotification.read) {
                            if (newNotification.type === "message") {
                                playSound("message");
                            } else {
                                playSound("notification");
                            }
                        }
                    } else if (payload.eventType === "UPDATE") {
                        const updatedNotification = payload.new as Notification;
                        dispatch({ type: 'UPDATE_NOTIFICATION', payload: updatedNotification });
                        // Recalculate unread count
                        fetchNotifications();
                    } else if (payload.eventType === "DELETE") {
                        dispatch({ type: 'REMOVE_NOTIFICATION', payload: payload.old.id });
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
                notifications: state.notifications,
                importantNotifications: state.importantNotifications,
                unreadCount: state.unreadCount,
                urgentCount: state.urgentCount,
                loading: state.loading,
                error: state.error,
                markAsRead,
                markAllAsRead,
                deleteNotification,
                refresh,
                counts: state.counts,
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
