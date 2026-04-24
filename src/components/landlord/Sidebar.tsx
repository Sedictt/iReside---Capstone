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
    ArrowUpRight,
    Megaphone,
    Settings
} from "lucide-react";
import { signOut } from "@/lib/supabase/client-auth";
import { RoleSidebar, type SidebarNavSection } from "@/components/navigation/RoleSidebar";
import { PropertySelector } from "@/components/landlord/PropertySelector";

const NAV_ITEMS: SidebarNavSection[] = [
    {
        category: "Main",
        hideHeading: true,
        collapsible: false,
        items: [
            { label: "Dashboard", href: "/landlord/dashboard", icon: LayoutDashboard },
            { label: "Statistics", href: "/landlord/statistics", icon: ArrowUpRight },
            { label: "Messaging", href: "/landlord/messages", icon: MessageSquare },
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
            { label: "Tenant Applications", href: "/landlord/applications", icon: ClipboardList, badge: 2 },
            { label: "Tenants", href: "/landlord/tenants", icon: Users },
            { label: "Maintenance", href: "/landlord/maintenance", icon: Wrench, badge: 3 },
        ]
    },
    {
        category: "Finance",
        icon: CreditCard,
        defaultExpanded: true,
        items: [
            { label: "Invoices", href: "/landlord/invoices", icon: CreditCard },
        ]
    },
    {
        category: "Settings",
        icon: Settings,
        defaultExpanded: true,
        items: [
            { label: "Settings", href: "/landlord/settings", icon: Settings },
        ]
    },
];


export function Sidebar() {
    return (
        <RoleSidebar
            sections={NAV_ITEMS}
            header={<PropertySelector />}
            onLogout={() => {
                void signOut();
            }}
        />
    );
}
