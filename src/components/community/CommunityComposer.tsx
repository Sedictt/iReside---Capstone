"use client"

import { useState, useRef, FormEvent } from "react"
import Image from "next/image"
import { m as motion, AnimatePresence } from "framer-motion"
import { ImageIcon, X, Send, Megaphone, BarChart3, MessageSquarePlus } from "lucide-react"

interface CommunityComposerProps {
    isManagementUser: boolean
    profile: any
    userInitial: string
    onSubmit: (data: { title: string, body: string, type: string, pollOptions: string[], photos: File[] }) => void
    isSubmitting: boolean
    uploadingPhotos: boolean
}

export function CommunityComposer({
    isManagementUser,
    profile,
    userInitial,
    onSubmit,
    isSubmitting,
    uploadingPhotos
}: CommunityComposerProps) {
    const [composerType, setComposerType] = useState<"discussion" | "poll" | "announcement">("discussion")
    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")
    const [pollOptions, setPollOptions] = useState<string[]>(["", ""])
    const [selectedPhotos, setSelectedPhotos] = useState<File[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            setSelectedPhotos(prev => [...prev, ...newFiles].slice(0, 4))
        }
    }

    const removePhoto = (index: number) => {
        setSelectedPhotos(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (!body.trim() && selectedPhotos.length === 0) return
        
        // For polls and announcements, the main text area is treated as the title/question
        const finalTitle = composerType === "discussion" ? "" : body.trim()
        const finalBody = composerType === "discussion" ? body.trim() : ""

        onSubmit({
            title: finalTitle,
            body: finalBody,
            type: composerType,
            pollOptions,
            photos: selectedPhotos
        })

        // Reset local state after submit
        setBody("")
        setPollOptions(["", ""])
        setSelectedPhotos([])
    }

    return (
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm dark:border-white/10 dark:bg-[#151515]">
            <form onSubmit={handleSubmit}>
                <div className="p-6">
                    {isManagementUser && (
                        <div className="mb-6 flex gap-2">
                            <TypeButton 
                                active={composerType === "discussion"} 
                                onClick={() => setComposerType("discussion")} 
                                icon={MessageSquarePlus} 
                                label="Discussion" 
                            />
                            <TypeButton 
                                active={composerType === "poll"} 
                                onClick={() => setComposerType("poll")} 
                                icon={BarChart3} 
                                label="Poll" 
                            />
                            <TypeButton 
                                active={composerType === "announcement"} 
                                onClick={() => setComposerType("announcement")} 
                                icon={Megaphone} 
                                label="Announcement" 
                            />
                        </div>
                    )}

                    <div className="flex gap-4">
                        <div
                            className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border shadow-inner dark:border-white/10 relative"
                            style={{ backgroundColor: profile?.avatar_bg_color || undefined }}
                        >
                            {profile?.avatar_url ? (
                                <Image src={profile.avatar_url} alt="Profile" fill className="object-cover" />
                            ) : (
                                <span className="font-bold text-foreground dark:text-white">{userInitial}</span>
                            )}
                        </div>
                        <div className="flex-1 space-y-3">
                            <textarea
                                value={body}
                                onChange={(e) => {
                                    setBody(e.target.value)
                                    const scrollHeight = e.target.scrollHeight
                                    e.target.style.cssText = `height: ${scrollHeight}px;`
                                }}
                                placeholder={
                                    composerType === "announcement" ? "What's the announcement about?..." : 
                                    composerType === "poll" ? "Ask your neighbors a question..." : 
                                    "What's on your mind, neighbor?..."
                                }
                                className="block min-h-[40px] w-full resize-none overflow-hidden border-none bg-transparent p-0 text-xl font-medium leading-relaxed text-foreground outline-none focus:ring-0 dark:text-white dark:placeholder:text-white/20"
                                rows={1}
                            />

                            {composerType === "poll" && (
                                <div className="space-y-2 pt-2">
                                    {pollOptions.map((option, index) => (
                                        <div key={option || `option-${index}`} className="group relative">
                                            <input
                                                type="text"
                                                value={option}
                                                onChange={(e) => {
                                                    const next = [...pollOptions]
                                                    next[index] = e.target.value
                                                    setPollOptions(next)
                                                }}
                                                placeholder={`Option ${index + 1}`}
                                                className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/5 dark:border-white/10 dark:bg-white/5"
                                            />
                                        </div>
                                    ))}
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => pollOptions.length < 5 && setPollOptions([...pollOptions, ""])}
                                            className="text-xs font-bold text-primary hover:underline disabled:opacity-50"
                                            disabled={pollOptions.length >= 5}
                                        >
                                            + Add Option
                                        </button>
                                        {pollOptions.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => setPollOptions(pollOptions.slice(0, -1))}
                                                className="text-xs font-bold text-muted-foreground hover:text-foreground"
                                            >
                                                - Remove Option
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="border-t border-border bg-muted/20 p-4 dark:border-white/5 dark:bg-white/[0.02]">
                    <div className="mb-4 flex flex-wrap gap-2 px-2">
                        <AnimatePresence>
                            {selectedPhotos.map((photo, index) => (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    key={URL.createObjectURL(photo)} 
                                    className="group relative size-20 overflow-hidden rounded-xl border border-border dark:border-white/10"
                                >
                                    <Image src={URL.createObjectURL(photo)} alt="Preview" fill className="object-cover" />
                                    <button 
                                        type="button" 
                                        onClick={() => removePhoto(index)} 
                                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                    >
                                        <X className="size-4" />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex gap-1 px-2">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                multiple 
                                onChange={handlePhotoSelect} 
                            />
                            <button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={selectedPhotos.length >= 4}
                                className="flex items-center gap-2 rounded-xl px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 dark:hover:bg-white/5 dark:hover:text-white"
                            >
                                <ImageIcon className="size-5" />
                                <span className="text-sm font-bold">Photo</span>
                            </button>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isSubmitting || uploadingPhotos || (!body.trim() && !title.trim() && selectedPhotos.length === 0)} 
                            className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        >
                            {uploadingPhotos ? "Uploading..." : isSubmitting ? "Publishing..." : "Publish"}
                            <Send className="size-5" />
                        </button>
                    </div>
                </div>
            </form>
        </section>
    )
}

function TypeButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                active 
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-white/5'
            }`}
        >
            <Icon className="size-4" />
            {label}
        </button>
    )
}
