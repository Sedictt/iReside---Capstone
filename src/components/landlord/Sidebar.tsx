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

const NAV_ITEMS: SidebarNavSection[] = [
    {
        category: "Main",
        items: [
            { label: "Dashboard", href: "/landlord/dashboard", icon: LayoutDashboard },
            { label: "Statistics", href: "/landlord/statistics", icon: ArrowUpRight },
        ]
    },
    {
        category: "Management",
        items: [
            { label: "Properties", href: "/landlord/properties", icon: Building2 },
            { label: "Unit Map", href: "/landlord/unit-map", icon: Map },
            { label: "Tenant Applications", href: "/landlord/applications", icon: ClipboardList, badge: 2 },
            { label: "Tenants", href: "/landlord/tenants", icon: Users },
        ]
    },
    {
        category: "Finance & Ops",
        items: [
            { label: "Invoices", href: "/landlord/invoices", icon: CreditCard },
            { label: "Maintenance", href: "/landlord/maintenance", icon: Wrench, badge: 3 },
            { label: "Community Hub", href: "/landlord/community", icon: Megaphone },
            { label: "Messaging", href: "/landlord/messages", icon: MessageSquare },
            { label: "Settings", href: "/landlord/settings", icon: Settings },
        ]
    },
];


export function Sidebar() {
    return (
        <RoleSidebar
            sections={NAV_ITEMS}
            onLogout={() => {
                void signOut();
            }}
        />
    );
}
