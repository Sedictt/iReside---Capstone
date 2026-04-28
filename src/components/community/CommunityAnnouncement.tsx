"use client"

import { motion } from "framer-motion"
import { Megaphone, X, Pin } from "lucide-react"

interface CommunityAnnouncementProps {
    announcement: any
    config: any
    isCollapsed: boolean
    onToggle: (collapsed: boolean) => void
    formatRelative: (val: string) => string
}

export function CommunityAnnouncement({
    announcement,
    config,
    isCollapsed,
    onToggle,
    formatRelative
}: CommunityAnnouncementProps) {
    if (!announcement || !config) return null

    if (isCollapsed) {
        return (
            <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => onToggle(false)}
                className="fixed right-6 top-24 z-[95] flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-card shadow-2xl transition-all hover:scale-110 dark:border-white/10"
            >
                <div className="relative">
                    <Megaphone className="h-6 w-6 text-primary" />
                    <span className="absolute -right-1 -top-1 flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-primary"></span>
                    </span>
                </div>
            </motion.button>
        )
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
        >
            <div className={`relative overflow-hidden rounded-[2rem] border-2 ${config.cardBorder} ${config.cardBg} shadow-lg`}>
                <div className="absolute right-0 top-0 p-4">
                    <button 
                        onClick={() => onToggle(true)}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <div className="flex flex-col gap-6 p-8 md:flex-row md:items-center">
                    <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${config.bg} ${config.color}`}>
                        <Megaphone className="h-8 w-8" />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${config.color} ${config.bg} border border-current opacity-80`}>
                                {config.badge}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Pin className="h-3 w-3 rotate-45" />
                                <span>{formatRelative(announcement.created_at)}</span>
                            </div>
                        </div>
                        <h2 className="text-xl font-black tracking-tight text-foreground dark:text-white">
                            {announcement.title || "Community Announcement"}
                        </h2>
                        <p className="text-base leading-relaxed text-muted-foreground dark:text-white/70">
                            {announcement.content}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
