"use client"

import Image from "next/image"
import { m as motion } from "framer-motion"
import { Search, Flag, Bell, Building2, ChevronDown, Check, Megaphone, MessageCircle, Bookmark } from "lucide-react"
import { ComponentType } from "react"

interface CommunityHeaderProps {
    title: string
    description: string
    searchQuery: string
    onSearchChange: (query: string) => void
    onToggleRules: () => void
    showRules: boolean
    activeTab: string
    onTabChange: (tab: any) => void
    isManagementUser: boolean
    managementProperties: Array<{ id: string; name: string }>
    selectedPropertyId: string
    onPropertySelect: (id: string) => void
    isPropertyDropdownOpen: boolean
    setIsPropertyDropdownOpen: (open: boolean) => void
    shouldUseNavbarPropertySelector: boolean
    profile: any
    userInitial: string
}

export function CommunityHeader({
    title,
    description,
    searchQuery,
    onSearchChange,
    onToggleRules,
    showRules,
    activeTab,
    onTabChange,
    isManagementUser,
    managementProperties,
    selectedPropertyId,
    onPropertySelect,
    isPropertyDropdownOpen,
    setIsPropertyDropdownOpen,
    shouldUseNavbarPropertySelector,
    profile,
    userInitial
}: CommunityHeaderProps) {
    return (
        <div className="space-y-8">
            <header className="relative overflow-hidden rounded-[2.5rem] border border-border bg-card p-8 shadow-sm dark:border-white/10 dark:bg-[#0a0a0a]/80 dark:shadow-2xl md:p-12">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
                </div>
                
                <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl dark:text-white">
                            {title}
                        </h1>
                        <p className="max-w-2xl text-lg font-light text-muted-foreground dark:text-white/60">
                            {description}
                        </p>

                        {isManagementUser && managementProperties.length > 0 && !shouldUseNavbarPropertySelector && (
                            <div className="relative z-50 w-full max-w-sm">
                                <button 
                                    type="button"
                                    onClick={() => setIsPropertyDropdownOpen(!isPropertyDropdownOpen)}
                                    className="group flex w-full items-center justify-between gap-2 rounded-2xl border border-border bg-background/50 px-4 py-3 text-sm font-medium text-foreground backdrop-blur-xl transition-all hover:bg-muted dark:border-white/10 dark:bg-white/5 dark:text-white"
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <Building2 className="size-4 shrink-0 text-primary" />
                                        <span className="truncate">
                                            {managementProperties.find(p => p.id === selectedPropertyId)?.name || 'Select Property'}
                                        </span>
                                    </div>
                                    <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${isPropertyDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {isPropertyDropdownOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setIsPropertyDropdownOpen(false)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsPropertyDropdownOpen(false); }}}
                                            tabIndex={0}
                                            role="button"
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-popover shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-[#1a1a1a]"
                                        >
                                            <div className="max-h-60 overflow-y-auto p-2">
                                                {managementProperties.map(p => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => {
                                                            onPropertySelect(p.id)
                                                            setIsPropertyDropdownOpen(false)
                                                        }}
                                                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                                                            selectedPropertyId === p.id 
                                                            ? 'bg-primary/10 text-primary' 
                                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                        }`}
                                                    >
                                                        <span className="truncate">{p.name}</span>
                                                        {selectedPropertyId === p.id && <Check className="size-4" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex w-full flex-col gap-4 xl:w-auto xl:items-end">
                        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center xl:max-w-md">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search discussions..."
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    className="w-full rounded-full border border-border bg-background/50 py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/5 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3">
                                <button 
                                    onClick={onToggleRules}
                                    className={`flex size-12 items-center justify-center rounded-full border transition-all ${
                                        showRules 
                                        ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                                        : 'border-border bg-background/50 text-muted-foreground hover:bg-muted hover:text-foreground dark:border-white/10 dark:bg-white/5'
                                    }`}
                                    title="Community Rules"
                                >
                                    <Flag className="size-5" />
                                </button>
                                <button className="flex size-12 items-center justify-center rounded-full border border-border bg-background/50 text-muted-foreground transition-all hover:bg-muted hover:text-foreground dark:border-white/10 dark:bg-white/5">
                                    <Bell className="size-5" />
                                </button>
                                <div
                                    className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border shadow-sm dark:border-white/20 relative"
                                    style={{ backgroundColor: profile?.avatar_bg_color || undefined }}
                                >
                                    {profile?.avatar_url ? (
                                        <Image src={profile.avatar_url} alt="Profile" fill className="object-cover" />
                                    ) : (
                                        <span className="font-bold text-foreground dark:text-white">{userInitial}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <nav className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <TabButton 
                    active={activeTab === "live"} 
                    onClick={() => onTabChange("live")} 
                    icon={Megaphone} 
                    label="Live Feed" 
                />
                <TabButton 
                    active={activeTab === "mine"} 
                    onClick={() => onTabChange("mine")} 
                    icon={MessageCircle} 
                    label="My Posts" 
                />
                {isManagementUser && (
                    <TabButton 
                        active={activeTab === "approvals"} 
                        onClick={() => onTabChange("approvals")} 
                        icon={Check} 
                        label="Approvals" 
                    />
                )}
                <TabButton 
                    active={activeTab === "saved"} 
                    onClick={() => onTabChange("saved")} 
                    icon={Bookmark} 
                    label="Saved" 
                />
            </nav>
        </div>
    )
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: ComponentType<any>, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 text-sm font-bold transition-all ${
                active 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-white/5 dark:hover:text-white'
            }`}
        >
            <Icon className="size-4" />
            {label}
        </button>
    )
}
