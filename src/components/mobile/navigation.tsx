"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

// ─── Screen Names ──────────────────────────────────────────
// Every screen in the app is registered here
export type ScreenName =
    // Onboarding & Auth
    | "splash"
    | "welcome"
    | "login"
    | "signup"
    | "emailVerification"
    // Tenant Screens
    | "tenantHome"
    | "propertySearch"
    | "propertyDetail"
    | "savedProperties"
    | "applicationForm"
    | "applicationTracker"
    | "applicationDetail"
    | "leaseList"
    | "leaseDetail"
    | "leaseSigning"
    | "payments"
    | "checkout"
    | "tenantChat"
    | "chatConversation"
    | "tenantProfile"
    | "tenantSettings"
    // Landlord Screens
    | "landlordHome"
    | "landlordProperties"
    | "landlordPropertyDetail"
    | "landlordUnitDetail"
    | "landlordApplications"
    | "landlordApplicationReview"
    | "landlordInvoices"
    | "landlordInvoiceDetail"
    | "landlordMaintenance"
    | "landlordMaintenanceDetail"
    | "landlordChat"
    | "landlordProfile"
    | "landlordSettings"
    // Shared
    | "notifications"
    | "irisChat"
    | "communityFeed"
    // Admin Screens
    | "adminHome"
    | "adminLandlords"
    | "adminSettings";

// ─── Tab Names ─────────────────────────────────────────────
export type TenantTab = "home" | "community" | "activity" | "chat" | "profile";
export type LandlordTab = "home" | "properties" | "community" | "activity" | "chat" | "profile";
export type AdminTab = "home" | "landlords" | "settings";
export type TabName = TenantTab | LandlordTab | AdminTab;

// ─── User Roles ────────────────────────────────────────────
export type AppRole = "tenant" | "landlord" | "admin" | null;

// ─── Tab → Default Screen Mapping ─────────────────────────
export const TENANT_TAB_SCREENS: Record<TenantTab, ScreenName> = {
    home:      "tenantHome",
    community: "communityFeed",
    activity:  "applicationTracker",
    chat:      "tenantChat",
    profile:   "tenantProfile",
};

export const LANDLORD_TAB_SCREENS: Record<LandlordTab, ScreenName> = {
    home:       "landlordHome",
    properties: "landlordProperties",
    community:  "communityFeed",
    activity:   "landlordApplications",
    chat:       "landlordChat",
    profile:    "landlordProfile",
};

export const ADMIN_TAB_SCREENS: Record<AdminTab, ScreenName> = {
    home: "adminHome",
    landlords: "adminLandlords",
    settings: "adminSettings",
};

// ─── Navigation Context Type ───────────────────────────────
interface NavigationContextType {
    // Current state
    currentScreen: ScreenName;
    activeTab: TabName;
    role: AppRole;
    screenStack: ScreenName[];
    screenParams: Record<string, unknown>;

    // Navigation actions
    navigate: (screen: ScreenName, params?: Record<string, unknown>) => void;
    goBack: () => void;
    switchTab: (tab: TabName) => void;
    setRole: (role: AppRole) => void;
    resetToScreen: (screen: ScreenName) => void;

    // Helpers
    canGoBack: boolean;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

// ─── Navigation Provider ───────────────────────────────────
export function NavigationProvider({ children }: { children: ReactNode }) {
    const [role, setRoleState] = useState<AppRole>(null);
    const [currentScreen, setCurrentScreen] = useState<ScreenName>("splash");
    const [activeTab, setActiveTab] = useState<TabName>("home");
    const [screenStack, setScreenStack] = useState<ScreenName[]>([]);
    const [screenParams, setScreenParams] = useState<Record<string, unknown>>({});

    // Navigate to a screen (pushes current to stack)
    const navigate = useCallback(
        (screen: ScreenName, params?: Record<string, unknown>) => {
            setScreenStack((prev) => [...prev, currentScreen]);
            setCurrentScreen(screen);
            if (params) setScreenParams(params);
            else setScreenParams({});
        },
        [currentScreen]
    );

    // Go back to previous screen
    const goBack = useCallback(() => {
        setScreenStack((prev) => {
            if (prev.length === 0) return prev;
            const newStack = [...prev];
            const previous = newStack.pop()!;
            setCurrentScreen(previous);
            setScreenParams({});
            return newStack;
        });
    }, []);

    // Switch bottom tab (clears stack, goes to tab's default screen)
    const switchTab = useCallback(
        (tab: TabName) => {
            setActiveTab(tab);
            setScreenStack([]);
            setScreenParams({});

            if (role === "tenant") {
                setCurrentScreen(TENANT_TAB_SCREENS[tab as TenantTab]);
            } else if (role === "landlord") {
                setCurrentScreen(LANDLORD_TAB_SCREENS[tab as LandlordTab]);
            } else if (role === "admin") {
                setCurrentScreen(ADMIN_TAB_SCREENS[tab as AdminTab]);
            }
        },
        [role]
    );

    // Set user role (and navigate to the appropriate home)
    const setRole = useCallback((newRole: AppRole) => {
        setRoleState(newRole);
        setScreenStack([]);
        setScreenParams({});
        setActiveTab("home");
        if (newRole === "tenant") {
            setCurrentScreen("tenantHome");
        } else if (newRole === "landlord") {
            setCurrentScreen("landlordHome");
        }
    }, []);

    // Reset navigation entirely to a single screen
    const resetToScreen = useCallback((screen: ScreenName) => {
        setScreenStack([]);
        setScreenParams({});
        setCurrentScreen(screen);
    }, []);

    const canGoBack = screenStack.length > 0;

    return (
        <NavigationContext.Provider
            value={{
                currentScreen,
                activeTab,
                role,
                screenStack,
                screenParams,
                navigate,
                goBack,
                switchTab,
                setRole,
                resetToScreen,
                canGoBack,
            }}
        >
            {children}
        </NavigationContext.Provider>
    );
}

// ─── Hook ──────────────────────────────────────────────────
export function useNavigation() {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error("useNavigation must be used within a NavigationProvider");
    }
    return context;
}
