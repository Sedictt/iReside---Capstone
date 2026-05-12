"use client"

import { useReducer, useRef, FormEvent } from "react"
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

interface ComposerState {
    composerType: "discussion" | "poll" | "announcement";
    title: string;
    body: string;
    pollOptions: string[];
    selectedPhotos: File[];
}

type ComposerAction = 
    | { type: "SET_COMPOSER_TYPE"; payload: "discussion" | "poll" | "announcement" }
    | { type: "SET_TITLE"; payload: string }
    | { type: "SET_BODY"; payload: string }
    | { type: "SET_POLL_OPTIONS"; payload: string[] }
    | { type: "SET_SELECTED_PHOTOS"; payload: File[] };

function composerReducer(state: ComposerState, action: ComposerAction): ComposerState {
    switch (action.type) {
        case "SET_COMPOSER_TYPE":
            return { ...state, composerType: action.payload };
        case "SET_TITLE":
            return { ...state, title: action.payload };
        case "SET_BODY":
            return { ...state, body: action.payload };
        case "SET_POLL_OPTIONS":
            return { ...state, pollOptions: action.payload };
        case "SET_SELECTED_PHOTOS":
            return { ...state, selectedPhotos: action.payload };
        default:
            return state;
    }
}

export function CommunityComposer({
    isManagementUser,
    profile,
    userInitial,
    onSubmit,
    isSubmitting,
    uploadingPhotos
}: CommunityComposerProps) {
    const [state, dispatch] = useReducer(composerReducer, {
        composerType: "discussion",
        title: "",
        body: "",
        pollOptions: ["", ""],
        selectedPhotos: []
    });
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            dispatch({ type: "SET_SELECTED_PHOTOS", payload: [...state.selectedPhotos, ...newFiles].slice(0, 4) })
        }
    }

    const removePhoto = (index: number) => {
        dispatch({ type: "SET_SELECTED_PHOTOS", payload: state.selectedPhotos.filter((_, i) => i !== index) })
    }

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (!state.body.trim() && state.selectedPhotos.length === 0) return
        
        // For polls and announcements, main text area is treated as title/question
        const finalTitle = state.composerType === "discussion" ? "" : state.body.trim()
        const finalBody = state.composerType === "discussion" ? state.body.trim() : ""

        onSubmit({
            title: finalTitle,
            body: finalBody,
            type: state.composerType,
            pollOptions: state.pollOptions,
            photos: state.selectedPhotos
        })

        // Reset local state after submit
        dispatch({ type: "SET_BODY", payload: "" })
        dispatch({ type: "SET_POLL_OPTIONS", payload: ["", ""] })
        dispatch({ type: "SET_SELECTED_PHOTOS", payload: [] })
    }

    return (
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm dark:border-white/10 dark:bg-[#151515]">
            <form onSubmit={handleSubmit}>
                <div className="p-6">
                    {isManagementUser && (
                        <div className="mb-6 flex gap-2">
                            <TypeButton 
                                active={state.composerType === "discussion"} 
                                onClick={() => dispatch({ type: "SET_COMPOSER_TYPE", payload: "discussion" })} 
                                icon={MessageSquarePlus} 
                                label="Discussion" 
                            />
                            <TypeButton 
                                active={state.composerType === "poll"} 
                                onClick={() => dispatch({ type: "SET_COMPOSER_TYPE", payload: "poll" })} 
                                icon={BarChart3} 
                                label="Poll" 
                            />
                            <TypeButton 
                                active={state.composerType === "announcement"} 
                                onClick={() => dispatch({ type: "SET_COMPOSER_TYPE", payload: "announcement" })} 
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
                                <span className="font-black text-foreground dark:text-white">{userInitial}</span>
                            )}
                        </div>
                        <div className="flex-1 space-y-3">
                            <textarea
                                value={state.body}
                                onChange={(e) => {
                                    dispatch({ type: "SET_BODY", payload: e.target.value })
                                    e.target.style.height = 'auto'
                                    e.target.style.height = `${e.target.scrollHeight}px`
                                }}
                                placeholder={
                                    state.composerType === "announcement" ? "What's the announcement about?..." :
                                    state.composerType === "poll" ? "Ask your neighbors a question..." :
                                    "What's on your mind, neighbor?..."
                                }
                                className="block min-h-[40px] w-full resize-none overflow-hidden border-none bg-transparent p-0 text-xl font-medium leading-relaxed text-foreground outline-none focus:ring-0 dark:text-white dark:placeholder:text-white/20"
                                rows={1}
                            />

                            {state.composerType === "poll" && (
                                <div className="space-y-2 pt-2">
                                    {state.pollOptions.map((option: string, index: number) => (
                                        <div key={`poll-option-${index}`} className="group relative">
                                            <input
                                                type="text"
                                                value={option}
                                                onChange={(e) => {
                                                    const next = [...state.pollOptions]
                                                    next[index] = e.target.value
                                                    dispatch({ type: "SET_POLL_OPTIONS", payload: next })
                                                }}
                                                placeholder={`Option ${index + 1}`}
                                                className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/5 dark:border-white/10 dark:bg-white/5"
                                            />
                                        </div>
                                    ))}
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => state.pollOptions.length < 5 && dispatch({ type: "SET_POLL_OPTIONS", payload: [...state.pollOptions, ""] })}
                                            className="text-xs font-black text-primary hover:underline disabled:opacity-50"
                                            disabled={state.pollOptions.length >= 5}
                                        >
                                            + Add Option
                                        </button>
                                        {state.pollOptions.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => dispatch({ type: "SET_POLL_OPTIONS", payload: state.pollOptions.slice(0, -1) })}
                                                className="text-xs font-black text-muted-foreground hover:text-foreground"
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
                            {state.selectedPhotos.map((photo: File, index: number) => (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    key={`photo-${index}-${photo.name}`} 
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
                                disabled={state.selectedPhotos.length >= 4}
                                className="flex items-center gap-2 rounded-xl px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 dark:hover:bg-white/5 dark:hover:text-white"
                            >
                                <ImageIcon className="size-5" />
                                <span className="text-sm font-black">Photo</span>
                            </button>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isSubmitting || uploadingPhotos || (!state.body.trim() && state.selectedPhotos.length === 0)} 
                            className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-2.5 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
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
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition-all ${
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
