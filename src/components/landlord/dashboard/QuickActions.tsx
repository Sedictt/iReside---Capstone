"use client";

import { useState } from "react";
import { Building2, Bell, FileText, Users, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

const actions = [
    {
        label: "Add Property",
        icon: Building2,
        color: "text-blue-400",
        bgcolor: "bg-blue-500",
        delay: 0.1
    },
    {
        label: "Create Invoice",
        icon: FileText,
        color: "text-emerald-400",
        bgcolor: "bg-emerald-500",
        delay: 0.05
    },
    {
        label: "New Lease",
        icon: Users,
        color: "text-purple-400",
        bgcolor: "bg-purple-500",
        delay: 0
    },
    {
        label: "Announce",
        icon: Bell,
        color: "text-amber-400",
        bgcolor: "bg-amber-500",
        delay: -0.05
    }
];

export function QuickActions({ simplifiedMode = false }: { simplifiedMode?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);

    const displayActions = actions.map(action => ({
        ...action,
        label: simplifiedMode ? (
            action.label === "Add Property" ? "List a House" :
                action.label === "Create Invoice" ? "Send a Bill" :
                    action.label === "New Lease" ? "Sign New Tenant" :
                        action.label === "Announce" ? "Tell Everyone" : action.label
        ) : action.label
    }));

    return (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <div className="flex flex-col items-end gap-3 mb-2">
                        {displayActions.map((action) => (
                            <motion.button
                                key={action.label}
                                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                                transition={{ duration: 0.2, delay: action.delay > 0 ? action.delay : 0 }}
                                className="group flex items-center gap-3"
                            >
                                <span className="text-sm font-medium text-white bg-neutral-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-lg origin-right scale-95 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100">
                                    {action.label}
                                </span>
                                <div className={cn(
                                    "flex h-12 w-12 items-center justify-center rounded-full shadow-lg border border-white/10 transition-transform active:scale-95 hover:scale-105",
                                    "bg-gradient-to-br from-lime-600 to-emerald-800"
                                )}>
                                    <action.icon className="h-5 w-5 text-white" />
                                </div>
                            </motion.button>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full shadow-xl shadow-lime-900/20 transition-all focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]",
                    isOpen
                        ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rotate-45"
                        : "bg-gradient-to-br from-lime-600 to-emerald-800 hover:from-lime-700 hover:to-emerald-900 text-white"
                )}
                whileTap={{ scale: 0.95 }}
                animate={{ rotate: isOpen ? 135 : 0 }}
                transition={{ duration: 0.3, ease: "anticipate" }}
            >
                <Plus className="h-7 w-7" />
            </motion.button>
        </div>
    );
}
