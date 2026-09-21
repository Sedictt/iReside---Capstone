"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { m as motion, AnimatePresence } from "framer-motion"
import { X, Shield } from "lucide-react"

interface CommunityRulesProps {
    isOpen?: boolean
    onClose: () => void
}

export function CommunityRules({ isOpen = true, onClose }: CommunityRulesProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Handle Escape key to close
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose()
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isOpen, onClose])

    // Prevent body scroll while lightbox is open
    useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow
            document.body.style.overflow = "hidden"
            return () => {
                document.body.style.overflow = originalOverflow
            }
        }
    }, [isOpen])

    if (!mounted) return null

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div 
                    className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="community-rules-title"
                >
                    {/* Dimmed backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
                        aria-hidden="true"
                    />

                    {/* Centered Lightbox Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative z-10 w-full max-w-2xl sm:max-w-3xl overflow-hidden rounded-[2rem] sm:rounded-3xl backdrop-blur-2xl neumorphic-panel border border-border/50 shadow-2xl my-auto"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border p-6 dark:border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                                    <Shield className="size-5" />
                                </div>
                                <div>
                                    <h3 id="community-rules-title" className="text-lg font-black tracking-tight text-foreground dark:text-white">Community Rules</h3>
                                    <p className="text-xs text-muted-foreground">Guidelines for a healthy community</p>
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={onClose}
                                className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors neumorphic-extruded"
                                aria-label="Close community rules"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Rules Grid */}
                        <div className="grid grid-cols-1 gap-6 p-6 sm:p-8 md:grid-cols-3">
                            <div className="space-y-3">
                                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary border border-primary/20">1</div>
                                <div>
                                    <p className="text-sm font-black text-foreground dark:text-white/80">Post Approval</p>
                                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground dark:text-white/40">All discussion posts require management approval before appearing in the public feed.</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary border border-primary/20">2</div>
                                <div>
                                    <p className="text-sm font-black text-foreground dark:text-white/80">Respect Others</p>
                                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground dark:text-white/40">Be respectful, polite, and neighborly. Harassment or toxic behavior will result in a ban.</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary border border-primary/20">3</div>
                                <div>
                                    <p className="text-sm font-black text-foreground dark:text-white/80">No Spam</p>
                                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground dark:text-white/40">Do not post repetitive content, advertisements, or unrelated commercial promotions.</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-center border-t border-border bg-muted/20 p-4 dark:border-white/5 dark:bg-white/5">
                            <button 
                                type="button"
                                onClick={onClose} 
                                className="px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
                            >
                                I understand
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}
