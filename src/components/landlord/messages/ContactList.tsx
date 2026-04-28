"use client";

import { Search, ArrowLeft, AlertTriangle, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { ContactItem as ContactItemType } from "./types";
import { ContactItem } from "./ContactItem";
import { cn } from "@/lib/utils";
import { RoleBadge } from "@/components/profile/RoleBadge";

interface ContactListProps {
    contacts: ContactItemType[];
    activeConversationId: string | null;
    setActiveConversationId: (id: string) => void;
    isSidebarLoading: boolean;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    userSearchResults: any[];
    isSearchingUsers: boolean;
    userSearchError: string | null;
    handleStartConversation: (id: string) => void;
    conversationsError: string | null;
    setConversationsError: (val: string | null) => void;
}

export function ContactList({
    contacts,
    activeConversationId,
    setActiveConversationId,
    isSidebarLoading,
    searchQuery,
    setSearchQuery,
    userSearchResults,
    isSearchingUsers,
    userSearchError,
    handleStartConversation,
    conversationsError,
    setConversationsError
}: ContactListProps) {
    return (
        <div className="flex h-full w-80 shrink-0 flex-col overflow-hidden rounded-[2rem] border border-border bg-surface-1 shadow-sm lg:w-96">
            {/* Header */}
            <div className="flex shrink-0 flex-col gap-5 p-6 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/landlord/dashboard"
                            className="rounded-xl border border-border bg-surface-2 p-2 transition-all hover:bg-surface-3 hover:scale-105 active:scale-95"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft className="h-4 w-4 text-high" />
                        </Link>
                        <h2 className="text-xl font-black tracking-tight text-high">Messages</h2>
                    </div>
                    <ThemeToggle variant="sidebar" className="h-9 w-9" />
                </div>

                <div className="relative group">
                    <Search className={cn(
                        "absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors",
                        searchQuery ? "text-primary" : "text-disabled"
                    )} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search people..."
                        className="w-full rounded-2xl border border-border bg-surface-2 py-2.5 pl-10 pr-4 text-sm text-high placeholder:text-disabled transition-all focus:border-primary focus:bg-surface-1 focus:ring-4 focus:ring-primary/5"
                    />

                    {searchQuery.trim().length >= 2 && (
                        <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-50 max-h-80 overflow-y-auto rounded-3xl border border-border bg-card p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                            {isSearchingUsers && (
                                <div className="px-4 py-3 text-xs font-bold text-disabled uppercase tracking-widest animate-pulse">Searching...</div>
                            )}
                            {!isSearchingUsers && userSearchError && (
                                <div className="px-4 py-3 text-xs text-red-500 font-medium">{userSearchError}</div>
                            )}
                            {!isSearchingUsers && !userSearchError && userSearchResults.length === 0 && (
                                <div className="px-4 py-3 text-xs text-disabled font-medium">No results found</div>
                            )}
                            {!isSearchingUsers && !userSearchError && userSearchResults.map((result) => (
                                <button
                                    key={result.id}
                                    onClick={() => handleStartConversation(result.id)}
                                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition-all hover:bg-primary/5 group"
                                >
                                    <div 
                                        className="h-10 w-10 shrink-0 rounded-full border border-border overflow-hidden flex items-center justify-center bg-surface-3 transition-transform group-hover:scale-105"
                                    >
                                        {result.avatarUrl ? (
                                            <img src={result.avatarUrl} alt={result.fullName} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold text-high">
                                                {(result.fullName || "C").charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <div className="truncate text-sm font-bold text-high group-hover:text-primary transition-colors">{result.fullName}</div>
                                            <RoleBadge role={result.role} />
                                        </div>
                                        <div className="truncate text-[10px] font-medium text-disabled">{result.email}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {conversationsError && (
                    <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-600 animate-in slide-in-from-top-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div className="flex-1 font-medium">{conversationsError}</div>
                        <button onClick={() => setConversationsError(null)} className="p-1 hover:bg-red-500/10 rounded-lg">
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                )}
            </div>

            {/* Contacts */}
            <div className="flex-1 overflow-y-auto custom-scrollbar-premium p-4 pt-0 space-y-1">
                {isSidebarLoading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-2xl animate-pulse">
                                <div className="h-12 w-12 rounded-full bg-surface-2" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-1/2 bg-surface-2 rounded" />
                                    <div className="h-2 w-1/3 bg-surface-3 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    contacts.map(contact => (
                        <ContactItem
                            key={contact.id}
                            contact={contact}
                            isActive={activeConversationId === contact.id}
                            onClick={() => setActiveConversationId(contact.id)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
