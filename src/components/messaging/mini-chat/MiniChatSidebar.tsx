"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, MessageSquare, RefreshCw, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/Skeleton";
import { RoleBadge, type BadgeRole } from "@/components/profile/RoleBadge";
import { ProfileCardTrigger } from "@/components/ui/ProfileCardTrigger";
import { getSafeAvatarBgColor } from "@/lib/constants";
import type { MiniChatContact } from "./types";
import type { MiniChatController } from "./useMiniChat";
import { getInitials } from "./utils";

export const SIDEBAR_EXPANDED_WIDTH_PX = 320;
export const SIDEBAR_COLLAPSED_WIDTH_PX = 88;
/** Gap between the sidebar and the docked chat windows. */
export const SIDEBAR_TRAY_GAP_PX = 20;

export const getTrayRightOffset = (isExpanded: boolean) =>
    (isExpanded ? SIDEBAR_EXPANDED_WIDTH_PX : SIDEBAR_COLLAPSED_WIDTH_PX) + SIDEBAR_TRAY_GAP_PX;

interface MiniChatSidebarProps {
    controller: MiniChatController;
    onExpandedChange?: (isExpanded: boolean) => void;
    /** Pinned entry rendered above the conversation list (e.g. an assistant shortcut). */
    renderLeading?: (context: { isExpanded: boolean }) => ReactNode;
    dataTourId?: string;
    className?: string;
}

function ConversationRow({
    conversation,
    isExpanded,
    isOpen,
    onOpen,
}: {
    conversation: MiniChatContact;
    isExpanded: boolean;
    isOpen: boolean;
    onOpen: () => void;
}) {
    const avatar = (
        <ProfileCardTrigger
            userId={conversation.participantUserId ?? ""}
            initialData={{ full_name: conversation.name, avatar_url: conversation.avatar, role: conversation.role as never }}
            asChild
        >
            <span className="relative block shrink-0">
                <span
                    className="block size-10 overflow-hidden rounded-full border-2 border-card"
                    style={{ backgroundColor: getSafeAvatarBgColor(conversation.avatarBgColor) }}
                >
                    <Image src={conversation.avatar} alt="" width={40} height={40} className="size-full object-cover" />
                </span>
                {conversation.unread && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-card">
                        {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                    </span>
                )}
            </span>
        </ProfileCardTrigger>
    );

    if (!isExpanded) {
        return (
            <li>
                <Tooltip content={conversation.name} side="left">
                    <button
                        type="button"
                        onClick={onOpen}
                        aria-label={`Open chat with ${conversation.name}${conversation.unread ? `, ${conversation.unreadCount} unread` : ""}`}
                        className={cn(
                            "rounded-full p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                            isOpen && "ring-2 ring-primary/50"
                        )}
                    >
                        {avatar}
                    </button>
                </Tooltip>
            </li>
        );
    }

    return (
        <li>
            <button
                type="button"
                onClick={onOpen}
                data-open={isOpen ? "true" : "false"}
                aria-label={`Open chat with ${conversation.name}`}
                className={cn(
                    "group flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-colors",
                    "hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    isOpen && "bg-primary/5"
                )}
            >
                {avatar}
                <span className="min-w-0 flex-1">
                    <span className="mb-0.5 flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1.5">
                            <span className={cn("truncate text-sm transition-colors group-hover:text-primary", conversation.unread ? "font-bold text-foreground" : "font-medium text-foreground/85")}>
                                {conversation.name}
                            </span>
                            <RoleBadge role={conversation.role} className="shrink-0" />
                        </span>
                        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{conversation.time}</span>
                    </span>
                    <span className={cn("block truncate text-xs", conversation.unread ? "font-medium text-foreground/85" : "text-muted-foreground")}>
                        {conversation.lastMessage}
                    </span>
                </span>
            </button>
        </li>
    );
}

export function MiniChatSidebar({ controller, onExpandedChange, renderLeading, dataTourId, className }: MiniChatSidebarProps) {
    const {
        conversations,
        filteredConversations,
        isLoadingConversations,
        conversationsError,
        hasUnreadConversations,
        refreshConversations,
        openChats,
        openChat,
        messagesHref,
        searchQuery,
        setSearchQuery,
        clearSearch,
        directoryUsers,
        isSearching,
        searchError,
        startingChatUserId,
        startConversationWithUser,
    } = controller;

    const [isHovered, setIsHovered] = useState(false);
    const [isFocusWithin, setIsFocusWithin] = useState(false);
    const trimmedQuery = searchQuery.trim();
    const isSearchingDirectory = trimmedQuery.length >= 2;
    const isExpanded = isHovered || isFocusWithin || trimmedQuery.length > 0;

    useEffect(() => {
        onExpandedChange?.(isExpanded);
    }, [isExpanded, onExpandedChange]);

    const handleBlur = useCallback((event: React.FocusEvent<HTMLElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsFocusWithin(false);
        }
    }, []);

    const openIds = new Set(openChats.map((chat) => chat.id));
    const listedConversations = trimmedQuery ? filteredConversations : conversations;
    const showNoMatches = !isLoadingConversations && trimmedQuery.length > 0 && listedConversations.length === 0 && directoryUsers.length === 0 && !isSearching;

    return (
        <aside
            data-tour-id={dataTourId}
            aria-label="Messages"
            className={cn(
                "fixed right-0 top-0 z-50 hidden h-full flex-col overflow-hidden border-l border-border bg-card text-foreground md:flex",
                "transition-[width] duration-500 ease-in-out",
                className
            )}
            style={{ width: isExpanded ? SIDEBAR_EXPANDED_WIDTH_PX : SIDEBAR_COLLAPSED_WIDTH_PX }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsFocusWithin(true)}
            onBlur={handleBlur}
        >
            {/* Header */}
            <div className="flex min-h-[88px] shrink-0 flex-col justify-center border-b border-border p-5">
                {!isExpanded ? (
                    <div className="flex flex-col items-center">
                        <div className="relative rounded-xl border border-border bg-muted p-2.5" aria-hidden="true">
                            <MessageSquare className="size-5 text-primary" />
                            {hasUnreadConversations && (
                                <span className="absolute -right-1 -top-1 size-3 animate-pulse rounded-full bg-red-500 ring-2 ring-card" />
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="size-4 text-primary" aria-hidden="true" />
                                <h2 className="text-sm font-bold tracking-tight text-foreground">Messages</h2>
                            </div>
                            {hasUnreadConversations && (
                                <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-500">
                                    New
                                </span>
                            )}
                        </div>

                        <div className="relative">
                            <Search
                                className={cn("absolute left-3 top-1/2 size-3.5 -translate-y-1/2 transition-colors", searchQuery ? "text-primary" : "text-muted-foreground")}
                                aria-hidden="true"
                            />
                            <input
                                type="search"
                                maxLength={60}
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Search messages or people…"
                                aria-label="Search messages or people"
                                className="w-full rounded-xl border border-border/60 bg-muted/60 py-2 pl-9 pr-8 text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground hover:bg-muted focus:border-primary/50 focus:bg-background [&::-webkit-search-cancel-button]:hidden"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    aria-label="Clear search"
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    <X className="size-3.5" aria-hidden="true" />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="custom-scrollbar relative flex flex-1 flex-col overflow-y-auto p-4">
                <div className={cn("flex flex-col", isExpanded ? "gap-1" : "items-center gap-3")}>
                    {renderLeading && !trimmedQuery && renderLeading({ isExpanded })}

                    {isLoadingConversations && conversations.length === 0 && (
                        <ul className={cn("flex flex-col", isExpanded ? "gap-1" : "items-center gap-3")} aria-label="Loading conversations">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <li key={index} className={cn("flex items-center gap-3", isExpanded ? "p-2.5" : "p-0.5")}>
                                    <Skeleton className="size-10 shrink-0 rounded-full" />
                                    {isExpanded && (
                                        <span className="flex flex-1 flex-col gap-1.5">
                                            <Skeleton className="h-3 w-28 rounded-md" />
                                            <Skeleton className="h-2.5 w-40 rounded-md opacity-70" />
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}

                    {trimmedQuery && listedConversations.length > 0 && isExpanded && (
                        <p className="px-2 pb-0.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Recent chats</p>
                    )}

                    <ul className={cn("flex flex-col", isExpanded ? "gap-1" : "items-center gap-3")} aria-label="Conversations">
                        {listedConversations.map((conversation) => (
                            <ConversationRow
                                key={conversation.id}
                                conversation={conversation}
                                isExpanded={isExpanded}
                                isOpen={openIds.has(conversation.id)}
                                onOpen={() => void openChat(conversation)}
                            />
                        ))}
                    </ul>

                    {isSearchingDirectory && isExpanded && (
                        <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                <span>People &amp; directory</span>
                                {isSearching && <Loader2 className="size-3 animate-spin" aria-hidden="true" />}
                            </div>

                            {isSearching && directoryUsers.length === 0 && (
                                <p className="animate-pulse px-3 py-2 text-xs text-muted-foreground">Searching users…</p>
                            )}
                            {!isSearching && searchError && (
                                <p className="px-3 py-2 text-xs font-medium text-red-500">{searchError}</p>
                            )}
                            {!isSearching && !searchError && directoryUsers.map((person) => {
                                const isStarting = startingChatUserId === person.id;
                                return (
                                    <button
                                        key={person.id}
                                        type="button"
                                        disabled={isStarting}
                                        onClick={() => void startConversationWithUser(person)}
                                        className="group flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-colors hover:bg-muted/70 disabled:opacity-50"
                                    >
                                        <span
                                            className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted"
                                            style={{ backgroundColor: person.avatarBgColor || undefined }}
                                        >
                                            {person.avatarUrl ? (
                                                <Image src={person.avatarUrl} alt="" width={40} height={40} className="size-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-bold text-foreground">{getInitials(person.fullName)}</span>
                                            )}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-center gap-1.5">
                                                <span className="truncate text-xs font-bold text-foreground transition-colors group-hover:text-primary">{person.fullName}</span>
                                                <RoleBadge role={person.role as BadgeRole} />
                                            </span>
                                            <span className="block truncate text-[10px] text-muted-foreground">{person.email}</span>
                                        </span>
                                        <span className="shrink-0 text-[10px] font-bold text-primary">
                                            {isStarting ? <Loader2 className="size-3.5 animate-spin" aria-label="Starting chat" /> : "Chat"}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {!isLoadingConversations && !trimmedQuery && conversations.length === 0 && !conversationsError && (
                        <p className={cn("text-xs text-muted-foreground", isExpanded ? "px-2 pt-2" : "sr-only")}>No conversations yet</p>
                    )}

                    {showNoMatches && isExpanded && (
                        <div className="px-4 py-8 text-center">
                            <p className="text-xs font-bold text-foreground">No matches found</p>
                            <p className="mt-0.5 text-[10px] text-muted-foreground">Nothing for &quot;{searchQuery}&quot;</p>
                        </div>
                    )}

                    {!isLoadingConversations && conversationsError && (
                        <div className={cn("flex items-center gap-2 text-xs text-red-500", isExpanded ? "px-2 pt-2" : "justify-center")} role="alert">
                            {isExpanded && <span className="min-w-0 flex-1 truncate" title={conversationsError}>{conversationsError}</span>}
                            <button
                                type="button"
                                onClick={() => void refreshConversations(true)}
                                aria-label="Retry loading conversations"
                                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold hover:bg-red-500/10"
                            >
                                <RefreshCw className="size-3" aria-hidden="true" />
                                {isExpanded && "Retry"}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            {isExpanded && (
                <div className="shrink-0 border-t border-border bg-card p-4 animate-in fade-in duration-500">
                    <Link
                        href={messagesHref}
                        className="flex w-full items-center justify-center rounded-xl border border-primary/30 bg-primary py-3 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                    >
                        Open full messaging
                    </Link>
                </div>
            )}
        </aside>
    );
}
