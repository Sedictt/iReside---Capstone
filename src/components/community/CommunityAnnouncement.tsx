"use client"

import { m as motion } from "framer-motion"
import { Megaphone, ChevronUp, ChevronDown, Clock, Trash2 } from "lucide-react"

interface CommunityAnnouncementProps {
    announcement: any
    config: any
    isCollapsed: boolean
    onToggle: (collapsed: boolean) => void
    formatRelative: (val: string) => string
    canDelete?: boolean
    onDelete?: (id: string) => void
}

export function CommunityAnnouncement({
    announcement,
    config,
    isCollapsed,
    onToggle,
    formatRelative,
    canDelete,
    onDelete
}: CommunityAnnouncementProps) {
    if (!announcement || !config) return null

    if (isCollapsed) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mb-8"
            >
                <div 
                    onClick={() => onToggle(false)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onToggle(false);
                        }
                    }}
                    className="group relative flex cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-2xl p-3 sm:px-5 neumorphic-panel transition-all hover:scale-[1.005] active:scale-[0.995]"
                    title="Announcement minimized - Click to expand"
                >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.bg} ${config.color}`}>
                            <Megaphone className="size-4" />
                        </div>
                        <span className={`hidden sm:inline-block shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${config.color} ${config.bg} border border-current opacity-80`}>
                            {config.badge}
                        </span>
                        <span className="truncate text-sm font-bold text-foreground dark:text-white">
                            {announcement.title || "Community Announcement"}
                        </span>
                        {announcement.content && (
                            <span className="hidden md:inline-block truncate text-xs text-muted-foreground/80 max-w-sm">
                                — {announcement.content}
                            </span>
                        )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <span className="hidden sm:inline text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                            Expand
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground group-hover:text-primary transition-colors neumorphic-extruded">
                            <ChevronDown className="size-4" />
                        </div>
                        {canDelete && onDelete && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("Are you sure you want to delete this announcement?")) {
                                        onDelete(announcement.id);
                                    }
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-red-500 transition-colors neumorphic-extruded ml-1"
                                title="Delete announcement"
                            >
                                <Trash2 className="size-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="mb-8"
        >
            <div className="relative overflow-hidden rounded-[2rem] neumorphic-panel">
                <div className="absolute right-0 top-0 p-4 flex items-center gap-2 z-10">
                    {canDelete && onDelete && (
                        <button
                            type="button"
                            onClick={() => {
                                if (confirm("Are you sure you want to delete this announcement?")) {
                                    onDelete(announcement.id);
                                }
                            }}
                            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:text-red-500 transition-colors neumorphic-extruded"
                            title="Delete announcement"
                        >
                            <Trash2 className="size-4" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => onToggle(true)}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors neumorphic-extruded"
                        title="Minimize announcement"
                    >
                        <ChevronUp className="size-4" />
                    </button>
                </div>
                
                <div className="flex flex-col gap-6 p-8 md:flex-row md:items-center">
                    <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${config.bg} ${config.color}`}>
                        <Megaphone className="size-5" />
                    </div>
                    
                    <div className="flex-1 space-y-2 pr-20 md:pr-24">
                        <div className="flex items-center gap-3">
                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${config.color} ${config.bg} border border-current opacity-80`}>
                                {config.badge}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
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
