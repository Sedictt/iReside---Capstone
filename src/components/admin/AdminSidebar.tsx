"use client";

import {
    LayoutDashboard,
    Users,
    FileCheck
} from "lucide-react";
import { signOut } from "@/lib/supabase/client-auth";
import { RoleSidebar, type SidebarNavSection } from "@/components/navigation/RoleSidebar";

const NAV_ITEMS: SidebarNavSection[] = [
    {
        category: "Main",
        items: [
            { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
            { label: "Registrations", href: "/admin/registrations", icon: FileCheck },
            { label: "User Directory", href: "/admin/users", icon: Users },
        ],
    },
];

export function AdminSidebar() {
    return (
        <RoleSidebar
            sections={NAV_ITEMS}
            className="hidden md:flex"
            onLogout={() => {
                void signOut();
            }}
        />
    );
}

