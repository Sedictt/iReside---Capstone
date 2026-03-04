"use client";

import { useNavigation, ScreenName, TabName } from "./navigation";
import SplashScreen from "./screens/SplashScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import LoginScreen from "./screens/LoginScreen";
import SignUpScreen from "./screens/SignUpScreen";
import EmailVerificationScreen from "./screens/EmailVerificationScreen";
import TenantHomeScreen from "./screens/TenantHomeScreen";
import PropertySearchScreen from "./screens/PropertySearchScreen";
import PropertyDetailScreen from "./screens/PropertyDetailScreen";
import SavedPropertiesScreen from "./screens/SavedPropertiesScreen";
import TenantChatScreen from "./screens/TenantChatScreen";
import ChatConversationScreen from "./screens/ChatConversationScreen";
import ApplicationFormScreen from "./screens/ApplicationFormScreen";
import ApplicationTrackerScreen from "./screens/ApplicationTrackerScreen";
import {
    Home,
    Search,
    ClipboardList,
    MessageSquare,
    User,
    Building2,
    Signal,
    BatteryFull,
    Wifi,
    Smartphone,
} from "lucide-react";
import styles from "./MobileAppShell.module.css";

// ─── Tab Configuration ─────────────────────────────────────
interface TabConfig {
    id: TabName;
    label: string;
    icon: typeof Home;
}

const TENANT_TABS: TabConfig[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "search", label: "Search", icon: Search },
    { id: "activity", label: "Activity", icon: ClipboardList },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "profile", label: "Profile", icon: User },
];

const LANDLORD_TABS: TabConfig[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "properties", label: "Properties", icon: Building2 },
    { id: "activity", label: "Activity", icon: ClipboardList },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "profile", label: "Profile", icon: User },
];

// ─── Screens that should NOT show the tab bar ──────────────
const SCREENS_WITHOUT_TABS: ScreenName[] = [
    "splash",
    "welcome",
    "login",
    "signup",
    "emailVerification",
    "propertyDetail",
    "applicationForm",
    "applicationDetail",
    "leaseDetail",
    "leaseSigning",
    "checkout",
    "chatConversation",
    "irisChat",
    "landlordPropertyDetail",
    "landlordUnitDetail",
    "landlordApplicationReview",
    "landlordInvoiceDetail",
    "landlordMaintenanceDetail",
];

// ─── Status Bar ────────────────────────────────────────────
function StatusBar() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: false,
    });

    return (
        <div className={styles.statusBar}>
            <span className={styles.statusTime}>{timeStr}</span>
            <div className={styles.statusIcons}>
                <span className={styles.statusIcon}>
                    <Signal size={13} strokeWidth={2.5} />
                </span>
                <span className={styles.statusIcon}>
                    <Wifi size={13} strokeWidth={2.5} />
                </span>
                <span className={styles.statusIcon}>
                    <BatteryFull size={15} strokeWidth={2.5} />
                </span>
            </div>
        </div>
    );
}

// ─── Bottom Tab Bar ────────────────────────────────────────
function BottomTabBar() {
    const { role, activeTab, switchTab } = useNavigation();

    const tabs = role === "landlord" ? LANDLORD_TABS : TENANT_TABS;

    return (
        <div className={styles.tabBar}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.id}
                        className={`${styles.tabItem} ${isActive ? styles.tabItemActive : ""}`}
                        onClick={() => switchTab(tab.id)}
                    >
                        <Icon className={styles.tabIcon} size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                        <span className={styles.tabLabel}>{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

// ─── Placeholder Screen (shown for unbuilt screens) ────────
function PlaceholderScreen({ name }: { name: ScreenName }) {
    return (
        <div className={styles.placeholder}>
            <div className={styles.placeholderIcon}>
                <Smartphone size={24} />
            </div>
            <h2 className={styles.placeholderTitle}>{formatScreenName(name)}</h2>
            <p className={styles.placeholderSub}>
                This screen will be built in a future development step.
            </p>
        </div>
    );
}

// Converts "tenantHome" → "Tenant Home"
function formatScreenName(name: string): string {
    return name
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (s) => s.toUpperCase())
        .trim();
}

// ─── Screen Router ─────────────────────────────────────────
// Maps screen names to components. Screens not yet built show a placeholder.
function ScreenRouter() {
    const { currentScreen } = useNavigation();

    // Screen registry — we'll add real components as we build them
    const screenComponents: Partial<Record<ScreenName, React.ComponentType>> = {
        splash: SplashScreen,
        welcome: WelcomeScreen,
        login: LoginScreen,
        signup: SignUpScreen,
        emailVerification: EmailVerificationScreen,
        tenantHome: TenantHomeScreen,
        propertySearch: PropertySearchScreen,
        propertyDetail: PropertyDetailScreen,
        savedProperties: SavedPropertiesScreen,
        tenantChat: TenantChatScreen,
        chatConversation: ChatConversationScreen,
        applicationForm: ApplicationFormScreen,
        applicationTracker: ApplicationTrackerScreen,
        // Screens will be registered here as they're built
    };

    const ScreenComponent = screenComponents[currentScreen];

    if (ScreenComponent) {
        return <ScreenComponent />;
    }

    return <PlaceholderScreen name={currentScreen} />;
}

// ─── Main App Shell ────────────────────────────────────────
export default function MobileAppShell() {
    const { currentScreen, role } = useNavigation();

    const showTabBar =
        role !== null && !SCREENS_WITHOUT_TABS.includes(currentScreen);

    return (
        <div className={styles.devWrapper}>
            <div className={styles.viewport}>
                {/* Status Bar */}
                <StatusBar />

                {/* Screen Content */}
                <div className={styles.screenArea}>
                    <div className={styles.screenContent} key={currentScreen}>
                        <ScreenRouter />
                    </div>
                </div>

                {/* Bottom Tab Bar */}
                {showTabBar && <BottomTabBar />}

                {/* Home Indicator */}
                <div className={styles.homeIndicator} />
            </div>
        </div>
    );
}
