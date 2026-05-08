"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { PageLoader } from "@/components/ui/LoadingSpinner";

interface GlobalLoadingContextType {
    setGlobalLoading: (isLoading: boolean, message?: string) => void;
    isGlobalLoading: boolean;
    loadingMessage: string | null;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined);

export function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
    const [isGlobalLoading, setIsGlobalLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

    const setGlobalLoading = useCallback((isLoading: boolean, message?: string) => {
        setIsGlobalLoading(isLoading);
        setLoadingMessage(message || null);
    }, []);

    return (
        <GlobalLoadingContext.Provider value={{ setGlobalLoading, isGlobalLoading, loadingMessage }}>
            {children}
            {isGlobalLoading && <PageLoader message={loadingMessage || "Loading iReside"} />}
        </GlobalLoadingContext.Provider>
    );
}

export function useGlobalLoading() {
    const context = useContext(GlobalLoadingContext);
    if (context === undefined) {
        throw new Error("useGlobalLoading must be used within a GlobalLoadingProvider");
    }
    return context;
}
