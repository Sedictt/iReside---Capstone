"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface NotificationData {
    title: string;
    message: string;
    type?: "info" | "success" | "warning";
}

interface NotificationContextType {
    showNotification: (data: NotificationData) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notification, setNotification] = useState<NotificationData | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    const showNotification = useCallback((data: NotificationData) => {
        setNotification(data);
        setIsVisible(true);

        // Auto-hide after 4 seconds
        setTimeout(() => {
            setIsVisible(false);
        }, 4000);
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {/* Global Notification Banner */}
            {notification && (
                <div 
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        padding: '12px 16px',
                        zIndex: 10000,
                        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
                        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        pointerEvents: isVisible ? 'auto' : 'none'
                    }}
                >
                    <div style={{
                        background: 'rgba(20, 20, 20, 0.85)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px',
                        padding: '12px 16px',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            background: '#6d9838',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: 900
                        }}>i</div>
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: '#fafafa' }}>{notification.title}</span>
                                <span style={{ fontSize: '10px', color: '#737373', fontWeight: 600 }}>now</span>
                            </div>
                            <p style={{ fontSize: '12px', color: '#a3a3a3', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {notification.message}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </NotificationContext.Provider>
    );
}

export function useGlobalNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useGlobalNotification must be used within a NotificationProvider");
    }
    return context;
}
