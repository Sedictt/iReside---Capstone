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
    Download
} from "lucide-react";
import { signOut } from "@/lib/supabase/client-auth";
import { RoleSidebar, type SidebarNavSection } from "@/components/navigation/RoleSidebar";
import { PropertySelector } from "@/components/landlord/PropertySelector";
import { useNotifications } from "@/context/NotificationContext";
import { cn } from "@/lib/utils";

export function Sidebar({
    isCollapsed = false,
    onToggleCollapse,
    showCollapseToggle = false,
    className,
}: {
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    showCollapseToggle?: boolean;
    className?: string;
}) {
    const { counts, importantNotifications } = useNotifications();
    
    const isUrgent = (type: string) => importantNotifications.some(n => n.type === type);

    const NAV_ITEMS: SidebarNavSection[] = [
        {
            category: "Main",
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
                    label: "Analytics", 
                    href: "/landlord/analytics", 
                    icon: BarChart2,
                    description: "Revenue trends, occupancy rates & financial performance metrics"
                },
                { 
                    label: "Messaging", 
                    href: "/landlord/messages", 
                    icon: MessageSquare, 
                    badge: counts.messages || undefined,
                    description: "Direct communications, tenant inquiries & broadcast channels"
                },
                { 
                    label: "Calendar", 
                    href: "/landlord/calendar", 
                    icon: Calendar,
                    description: "Viewing schedules, property inspections & lease milestone dates"
                },
                { 
                    label: "Community Hub", 
                    href: "/landlord/community", 
                    icon: Megaphone,
                    description: "Building announcements, community posts & resident discussions"
                },
            ]
        },
        {
            category: "Portfolio",
            icon: Building2,
            defaultExpanded: true,
            dividerBefore: true,
            items: [
                { 
                    label: "Properties", 
                    href: "/landlord/properties", 
                    icon: Building2, 
                    tourId: "nav-properties",
                    description: "Manage registered buildings, configure units & set property amenities"
                },
                { 
                    label: "Unit Map", 
                    href: "/landlord/unit-map", 
                    icon: Map, 
                    tourId: "nav-unit-map",
                    description: "Interactive 2D architectural blueprint & visual unit layout planner"
                },
                { 
                    label: "Facilities", 
                    href: "/landlord/utilities", 
                    icon: LayoutGrid,
                    description: "Track on-site facilities, building amenities & shared utility meters"
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
                    label: "Tenants", 
                    href: "/landlord/tenants", 
                    icon: Users, 
                    tourId: "nav-tenant-hub",
                    description: "Active resident profiles, occupancy records & emergency contacts"
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
            category: "Finance",
            icon: CreditCard,
            defaultExpanded: true,
            items: [
                { 
                    label: "Finance Hub", 
                    href: "/landlord/invoices", 
                    icon: CreditCard, 
                    tourId: "nav-finance-hub", 
                    urgent: isUrgent('payment'),
                    description: "Rental ledger, incoming payments, receipts & automated billing"
                },
                { 
                    label: "Utility Billing", 
                    href: "/landlord/utility-billing", 
                    icon: Zap,
                    description: "Calculate, allocate and bill electricity, water & submeter charges"
                },
            ]
        },
        {
            category: "Account",
            icon: User,
            defaultExpanded: true,
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

    return (
        <RoleSidebar
            sections={NAV_ITEMS}
            header={<PropertySelector isCollapsed={isCollapsed} />}
            onLogout={() => {
                void signOut();
            }}
            isCollapsed={isCollapsed}
            onToggleCollapse={onToggleCollapse}
            showCollapseToggle={showCollapseToggle}
            className={`neu-landlord-sidebar ${className || ''}`}
        />
    );
}
