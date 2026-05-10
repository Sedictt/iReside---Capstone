"use client"

import { motion } from "framer-motion"
import { Flag, MoreHorizontal } from "lucide-react"

interface CommunityRulesProps {
    onClose: () => void
}

export function CommunityRules({ onClose }: CommunityRulesProps) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-x-0 top-0 z-50 px-1"
        >
            <div className="overflow-hidden rounded-3xl border border-border bg-card/95 shadow-[0_20px_50px_rgba(0,0,0,0.1)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#121212]/95 dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between border-b border-border p-6 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Flag className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold tracking-tight text-foreground dark:text-white">Community Rules</h3>
                            <p className="text-xs text-muted-foreground">Guidelines for a healthy community</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white"
                    >
                        <MoreHorizontal className="h-5 w-5 rotate-90" />
                    </button>
                </div>
                <div className="grid grid-cols-1 gap-6 p-8 md:grid-cols-3">
                    <div className="space-y-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</div>
                        <div>
                            <p className="text-sm font-bold text-foreground dark:text-white/80">Post Approval</p>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground dark:text-white/40">All discussion posts require management approval before appearing in the public feed.</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</div>
                        <div>
                            <p className="text-sm font-bold text-foreground dark:text-white/80">Respect Others</p>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground dark:text-white/40">Be respectful, polite, and neighborly. Harassment or toxic behavior will result in a ban.</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</div>
                        <div>
                            <p className="text-sm font-bold text-foreground dark:text-white/80">No Spam</p>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground dark:text-white/40">Do not post repetitive content, advertisements, or unrelated commercial promotions.</p>
                        </div>
                    </div>
                </div>
                <div className="flex justify-center border-t border-border bg-muted/20 p-4 dark:border-white/5 dark:bg-white/5">
                    <button 
                        onClick={onClose} 
                        className="text-xs font-bold uppercase tracking-widest text-primary transition-colors hover:text-primary/80"
                    >
                        I understand
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
