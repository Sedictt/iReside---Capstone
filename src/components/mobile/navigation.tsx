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
    | "addProperty"
    // Shared
    | "notifications"
    | "irisChat"
    | "communityFeed"
    | "photoGallery"
    // Phase 9
    | "landlordWalkInApp"
    | "moveInChecklist"
    | "revenueDashboard"
    | "inbox"
    | "activity";

// ─── Tab Names ─────────────────────────────────────────────
export type TenantTab = "home" | "activity" | "inbox" | "profile";
export type LandlordTab = "home" | "properties" | "activity" | "inbox" | "profile";
export type TabName = TenantTab | LandlordTab;

// ─── User Roles ────────────────────────────────────────────
export type AppRole = "tenant" | "landlord" | null;

// ─── Tab → Default Screen Mapping ─────────────────────────
export const TENANT_TAB_SCREENS: Record<TenantTab, ScreenName> = {
    home:     "tenantHome",
    activity: "applicationTracker",
    inbox:    "inbox",
    profile:  "tenantProfile",
};

export const LANDLORD_TAB_SCREENS: Record<LandlordTab, ScreenName> = {
    home:       "landlordHome",
    properties: "landlordProperties",
    activity:   "activity",
    inbox:      "inbox",
    profile:    "landlordProfile",
};

// ─── Reverse Lookup: Screen → Tab ──────────────────────────
// Maps any screen name to the tab it belongs to, for auto-syncing the indicator
const TENANT_SCREEN_TO_TAB: Partial<Record<ScreenName, TenantTab>> = {
    tenantHome:          "home",
    propertySearch:      "home",
    propertyDetail:      "home",
    savedProperties:     "home",
    applicationTracker:  "activity",
    applicationForm:     "activity",
    applicationDetail:   "activity",
    leaseList:           "activity",
    leaseDetail:         "activity",
    leaseSigning:        "activity",
    payments:            "activity",
    checkout:            "activity",
    inbox:               "inbox",
    tenantChat:          "inbox",
    chatConversation:    "inbox",
    communityFeed:       "inbox",
    irisChat:            "inbox",
    tenantProfile:       "profile",
    tenantSettings:      "profile",
    notifications:       "profile",
};

const LANDLORD_SCREEN_TO_TAB: Partial<Record<ScreenName, LandlordTab>> = {
    landlordHome:              "home",
    revenueDashboard:          "home",
    notifications:             "home",
    landlordProperties:        "properties",
    landlordPropertyDetail:    "properties",
    landlordUnitDetail:        "properties",
    landlordWalkInApp:         "properties",
    activity:                  "activity",
    landlordApplications:      "activity",
    landlordApplicationReview: "activity",
    landlordInvoices:          "activity",
    landlordInvoiceDetail:     "activity",
    landlordMaintenance:       "activity",
    landlordMaintenanceDetail: "activity",
    moveInChecklist:           "activity",
    inbox:                     "inbox",
    landlordChat:              "inbox",
    chatConversation:          "inbox",
    communityFeed:             "inbox",
    photoGallery:              "inbox",
    landlordProfile:           "profile",
    landlordSettings:          "profile",
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

    // Navigate to a screen (pushes current to stack & auto-syncs active tab)
    const navigate = useCallback(
        (screen: ScreenName, params?: Record<string, unknown>) => {
            setScreenStack((prev) => [...prev, currentScreen]);
            setCurrentScreen(screen);
            if (params) setScreenParams(params);
            else setScreenParams({});

            // Auto-sync the bottom tab indicator
            const tabForScreen =
                role === "tenant"
                    ? TENANT_SCREEN_TO_TAB[screen]
                    : role === "landlord"
                        ? LANDLORD_SCREEN_TO_TAB[screen]
                        : undefined;
            if (tabForScreen) {
                setActiveTab(tabForScreen);
            }
        },
        [currentScreen, role]
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
