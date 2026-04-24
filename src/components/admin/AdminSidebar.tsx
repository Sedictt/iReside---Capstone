"use client";

import {
    LayoutDashboard,
    Users,
    FileCheck,
    MessageSquareWarning,
    PenTool,
} from "lucide-react";
import { signOut } from "@/lib/supabase/client-auth";
import { RoleSidebar, type SidebarNavSection } from "@/components/navigation/RoleSidebar";

const NAV_ITEMS: SidebarNavSection[] = [
    {
        category: "Main",
        hideHeading: true,
        collapsible: false,
        items: [
            { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
            { label: "Registrations", href: "/admin/registrations", icon: FileCheck },
            { label: "User Directory", href: "/admin/users", icon: Users },
            { label: "Chat Moderation", href: "/admin/chat-moderation", icon: MessageSquareWarning },
        ],
    },
    {
        category: "Temporary",
        items: [
            { label: "Consultation Tool", href: "/admin/consultation-tool", icon: PenTool },
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

