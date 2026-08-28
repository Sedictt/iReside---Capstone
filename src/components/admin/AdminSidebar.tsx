/**
 * @deprecated [DEPRECATED - Turnkey Architecture]
 * Legacy multi-tenant admin portal sidebar navigation.
 * Retained for non-destructive technical reference only.
 * Excluded from active turnkey system architecture, documentation, and diagrams.
 */
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
            { 
                label: "Overview", 
                href: "/admin/dashboard", 
                icon: LayoutDashboard,
                description: "System health metrics, active user stats & platform overview"
            },
            { 
                label: "Registrations", 
                href: "/admin/registrations", 
                icon: FileCheck,
                description: "Review & approve incoming landlord and tenant registrations"
            },
            { 
                label: "User Directory", 
                href: "/admin/users", 
                icon: Users,
                description: "Manage registered accounts, roles and platform permissions"
            },
            { 
                label: "Chat Moderation", 
                href: "/admin/chat-moderation", 
                icon: MessageSquareWarning,
                description: "Inspect flagged messages, enforce community rules & safety"
            },
        ],
    },
    {
        category: "Temporary",
        items: [
            { 
                label: "Consultation Tool", 
                href: "/admin/consultation-tool", 
                icon: PenTool,
                description: "Real-time consultation and tenant guidance tool"
            },
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

