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
    Zap
} from "lucide-react";
import { signOut } from "@/lib/supabase/client-auth";
import { RoleSidebar, type SidebarNavSection } from "@/components/navigation/RoleSidebar";
import { PropertySelector } from "@/components/landlord/PropertySelector";
import { useNotifications } from "@/context/NotificationContext";

export function Sidebar({
    isCollapsed = false,
    onToggleCollapse,
    showCollapseToggle = false,
}: {
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    showCollapseToggle?: boolean;
}) {
    const { counts } = useNotifications();

    const NAV_ITEMS: SidebarNavSection[] = [
        {
            category: "Main",
            hideHeading: true,
            collapsible: false,
            items: [
                { label: "Dashboard", href: "/landlord/dashboard", icon: LayoutDashboard },
                { label: "Analytics", href: "/landlord/analytics", icon: BarChart2 },
                { label: "Messaging", href: "/landlord/messages", icon: MessageSquare, badge: counts.messages || undefined },
                { label: "Community Hub", href: "/landlord/community", icon: Megaphone },
            ]
        },
        {
            category: "Portfolio",
            icon: Building2,
            defaultExpanded: true,
            dividerBefore: true,
            items: [
                { label: "Properties", href: "/landlord/properties", icon: Building2 },
                { label: "Unit Map", href: "/landlord/unit-map", icon: Map },
                { label: "Facilities", href: "/landlord/utilities", icon: LayoutGrid },
                { label: "Tenant Applications", href: "/landlord/applications", icon: ClipboardList, badge: counts.applications || undefined },
                { label: "Tenants", href: "/landlord/tenants", icon: Users },
                { label: "Maintenance", href: "/landlord/maintenance", icon: Wrench, badge: counts.maintenance || undefined },
            ]
        },
        {
            category: "Finance",
            icon: CreditCard,
            defaultExpanded: true,
            items: [
                { label: "Finance Hub", href: "/landlord/invoices", icon: CreditCard },
                { label: "Utility Billing", href: "/landlord/utility-billing", icon: Zap },
            ]
        },
        {
            category: "Account",
            icon: User,
            defaultExpanded: true,
            items: [
                { label: "Profile", href: "/landlord/profile", icon: User },
                { label: "Settings", href: "/landlord/settings", icon: Settings },
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
        />
    );
}
