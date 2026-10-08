"use client";

import {
    LayoutDashboard,
    Building2,
    Users,
    CreditCard,
    Wrench,
    MessageSquare,
    ClipboardList,
    Map,
    Megaphone,
    Settings,
    User,
    LayoutGrid,
    BarChart2,
    Zap,
    ShieldCheck,
    FileText,
    Calendar,
    BookOpen,
    Download,
    Plus
} from "lucide-react";
import { useState, useEffect } from "react";
import { signOut } from "@/lib/supabase/client-auth";
import { RoleSidebar, type SidebarNavSection, type SidebarLockStage } from "@/components/navigation/RoleSidebar";
import { PropertySelector } from "@/components/landlord/PropertySelector";
import { LogoutConfirmationModal } from "@/components/ui/LogoutConfirmationModal";
import { useNotifications } from "@/context/NotificationContext";
import { useLandlordSetup } from "@/hooks/useLandlordSetup";
import { cn } from "@/lib/utils";

export function Sidebar({
    onCloseMobile,
    className,
}: {
    onCloseMobile?: () => void;
    className?: string;
}) {
    const { counts, importantNotifications } = useNotifications();
    // Lock stage and tenant reminder come from the shared setup resolver (DB-backed, loading-safe)
    const setup = useLandlordSetup();
    const isTenantSetupDelayed = Boolean(setup.steps.find((step) => step.id === "first_tenant")?.deferred);
    const isBillingDeferred = Boolean(setup.steps.find((step) => step.id === "billing")?.deferred);
    const lockStage: SidebarLockStage = setup.lockStage;
    const isLocked = lockStage !== null;

    const isUrgent = (type: string) => importantNotifications.some(n => n.type === type);

    const NAV_ITEMS: SidebarNavSection[] = [
        {
            category: "Daily Operations",
            hideHeading: true,
            collapsible: false,
            items: [
                { 
                    label: "Dashboard", 
                    href: "/landlord/dashboard", 
                    icon: LayoutDashboard,
                    description: "Operational overview, urgent tasks & real-time property KPIs"
                },
                { 
                    label: "Unit Map", 
                    href: "/landlord/unit-map", 
                    icon: Map, 
                    tourId: "nav-unit-map",
                    description: "Interactive 2D architectural blueprint & visual unit layout planner"
                },
                { 
                    label: "Messages", 
                    href: "/landlord/messages", 
                    icon: MessageSquare, 
                    badge: counts.messages || undefined,
                    description: "Direct communications, tenant inquiries & broadcast channels"
                },
                { 
                    label: "Finance Hub", 
                    href: "/landlord/invoices", 
                    icon: CreditCard, 
                    tourId: "nav-finance-hub", 
                    urgent: isUrgent('payment'),
                    description: "Rental ledger, incoming payments, receipts & automated billing"
                },
                { 
                    label: "Maintenance", 
                    href: "/landlord/maintenance", 
                    icon: Wrench, 
                    badge: counts.maintenance || undefined, 
                    urgent: isUrgent('maintenance'),
                    description: "Track repair tickets, contractor assignments & resolution progress"
                },
            ]
        },
        {
            category: "Residents",
            icon: Users,
            defaultExpanded: true,
            collapsible: true,
            dividerBefore: true,
            items: [
                { 
                    label: "Tenants", 
                    href: "/landlord/tenants", 
                    icon: Users, 
                    tourId: "nav-tenant-hub",
                    warning: isTenantSetupDelayed,
                    warningTooltip: "Action needed: Begin setting up your tenants to occupy units and activate lease tracking.",
                    description: "Active resident profiles, occupancy records & emergency contacts",
                    action: {
                        icon: Plus,
                        label: "Add Tenant",
                        href: "/landlord/tenants?action=new",
                        hotkey: "A"
                    }
                },
                { 
                    label: "Applications", 
                    href: "/landlord/applications", 
                    icon: ClipboardList, 
                    badge: counts.applications || undefined, 
                    urgent: isUrgent('application'),
                    description: "Review tenant applications, screening details & issue digital approvals"
                },
                { 
                    label: "Leases", 
                    href: "/landlord/leases", 
                    icon: FileText, 
                    urgent: isUrgent('lease') || isUrgent('lease_renewal_request'),
                    description: "Digital lease agreements, active contracts & renewal negotiations"
                },
                { 
                    label: "Move-Out Requests", 
                    href: "/landlord/move-out", 
                    icon: ClipboardList, 
                    urgent: isUrgent('move_out_approved') || isUrgent('move_out_denied'),
                    description: "Process resident move-out notices, checkout inspections & deposit refunds"
                },
            ]
        },
        {
            category: "Property & Spaces",
            icon: Building2,
            defaultExpanded: true,
            collapsible: true,
            dividerBefore: false,
            items: [
                { 
                    label: "Properties", 
                    href: "/landlord/properties", 
                    icon: Building2, 
                    tourId: "nav-properties",
                    description: "Manage registered buildings, configure units & set property amenities",
                    action: {
                        icon: Plus,
                        label: "Add Property",
                        href: "/landlord/properties/new",
                        hotkey: "P"
                    }
                },
                { 
                    label: "Utility Billing", 
                    href: "/landlord/utility-billing", 
                    icon: Zap,
                    warning: isBillingDeferred,
                    warningTooltip: "Action needed: Configure your payment channels and utility tariffs to automate billing.",
                    description: "Calculate, allocate and bill electricity, water & submeter charges"
                },
                { 
                    label: "Facilities", 
                    href: "/landlord/utilities", 
                    icon: LayoutGrid,
                    description: "Track on-site facilities, building amenities & shared utility meters"
                },
            ]
        },
        {
            category: "Community & Insights",
            icon: BarChart2,
            defaultExpanded: false,
            collapsible: true,
            dividerBefore: false,
            items: [
                { 
                    label: "Analytics", 
                    href: "/landlord/analytics", 
                    icon: BarChart2, 
                    description: "Revenue trends, occupancy rates & financial performance metrics"
                },
                { 
                    label: "Community Hub", 
                    href: "/landlord/community", 
                    icon: Megaphone,
                    description: "Building announcements, community posts & resident discussions"
                },
                { 
                    label: "Calendar", 
                    href: "/landlord/calendar", 
                    icon: Calendar,
                    description: "Viewing schedules, property inspections & lease milestone dates"
                },
            ]
        },
        {
            category: "System & Account",
            icon: Settings,
            defaultExpanded: false,
            collapsible: true,
            dividerBefore: false,
            items: [
                { 
                    label: "Profile", 
                    href: "/landlord/profile", 
                    icon: User,
                    description: "Public landlord profile, contact info & verification credentials"
                },
                { 
                    label: "Document Vault", 
                    href: "/landlord/documents", 
                    icon: ShieldCheck,
                    description: "Encrypted storage for signed contracts, property deeds & permits"
                },
                { 
                    label: "Settings", 
                    href: "/landlord/settings", 
                    icon: Settings,
                    description: "Payout bank accounts, notification preferences & security settings"
                },
                { 
                    label: "Documentation", 
                    href: "/landlord/docs", 
                    icon: BookOpen,
                    description: "User manual, FAQs, troubleshooting & IT handover runbook"
                },
                { 
                    label: "Download Apps", 
                    href: "/download", 
                    icon: Download,
                    description: "Native Windows .exe client and Android APK package"
                },
            ]
        },
    ];

    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isTourActiveOnNav, setIsTourActiveOnNav] = useState(false);

    useEffect(() => {
        const handleTourState = (e: any) => {
            if (e.detail?.isOpen && e.detail?.step === 3) {
                setIsTourActiveOnNav(true);
            } else {
                setIsTourActiveOnNav(false);
            }
        };

        window.addEventListener("dashboard-tour-state" as any, handleTourState);
        return () => window.removeEventListener("dashboard-tour-state" as any, handleTourState);
    }, []);

    return (
        <>
            <RoleSidebar
                sections={NAV_ITEMS}
                header={
                    <div className={cn(
                        "relative transition-all duration-300 rounded-2xl",
                        isTourActiveOnNav && "ring-4 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_30px_rgba(155,119,255,0.85)] animate-pulse z-40"
                    )}>
                        {isTourActiveOnNav && (
                            <span className="absolute -top-1.5 -right-1.5 flex size-2.5 z-50">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full size-2.5 bg-primary"></span>
                            </span>
                        )}
                        <PropertySelector />
                    </div>
                }
                onLogout={() => setIsLogoutModalOpen(true)}
                onClose={onCloseMobile}
                isLocked={isLocked}
                lockStage={lockStage}
                className={`neu-landlord-sidebar ${className || ''}`}
            />
            <LogoutConfirmationModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
            />
        </>
    );
}
