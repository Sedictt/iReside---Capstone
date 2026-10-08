"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { m as motion, useReducedMotion } from "framer-motion";
import {
    Archive,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Flag,
    FolderOpen,
    Loader2,
    MoreHorizontal,
    ShieldBan,
    UserRound,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleBadge } from "@/components/profile/RoleBadge";
import { useProfileCard } from "@/context/ProfileCardContext";
import { getSafeAvatarBgColor } from "@/lib/constants";
import { MiniChatComposer } from "./MiniChatComposer";
import { MiniChatMessageList } from "./MiniChatMessageList";
import type { MiniChatMenuAction, MiniChatRole, MiniChatState, OpenMiniChat } from "./types";
import { DEFAULT_CHAT_STATE, WINDOW_WIDTH_PX } from "./utils";

const WINDOW_HEIGHT_PX = 448;

interface MiniChatWindowProps {
    chat: OpenMiniChat;
    state: MiniChatState | undefined;
    viewerRole: MiniChatRole;
    messagesHref: string;
    menuActionId: string | null;
    onActivate: (id: string) => void;
    onClose: (id: string) => void;
    onToggleMinimize: (id: string) => void;
    onDraftChange: (id: string, draft: string) => void;
    onSend: (id: string) => void;
    onRetry: (id: string, messageId: string) => void;
    onDiscard: (id: string, messageId: string) => void;
    onAttach: (id: string, file: File) => void;
    onReload: (id: string) => void;
    onDismissError: (id: string) => void;
    onOpenSharedFiles: (id: string) => void;
    onMenuAction: (chat: OpenMiniChat, action: MiniChatMenuAction) => void;
}

export function MiniChatWindow({
    chat,
    state,
    viewerRole,
    messagesHref,
    menuActionId,
    onActivate,
    onClose,
    onToggleMinimize,
    onDraftChange,
    onSend,
    onRetry,
    onDiscard,
    onAttach,
    onReload,
    onDismissError,
    onOpenSharedFiles,
    onMenuAction,
}: MiniChatWindowProps) {
    const chatState = state ?? DEFAULT_CHAT_STATE;
    const { openProfile } = useProfileCard();
    const shouldReduceMotion = useReducedMotion();
    const sectionRef = useRef<HTMLElement | null>(null);
    const [pendingConfirm, setPendingConfirm] = useState<"block" | "archive" | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const firstName = chat.name.split(" ")[0] || chat.name;
    const isBusy = menuActionId !== null && menuActionId.startsWith(`${chat.id}:`);

    const activate = useCallback(() => {
        if (!chat.isActive) onActivate(chat.id);
    }, [chat.id, chat.isActive, onActivate]);

    // Escape closes the window when focus is inside it (and no menu is open).
    useEffect(() => {
        const node = sectionRef.current;
        if (!node) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !isMenuOpen) {
                event.stopPropagation();
                onClose(chat.id);
            }
        };
        node.addEventListener("keydown", handleKeyDown);
        return () => node.removeEventListener("keydown", handleKeyDown);
    }, [chat.id, isMenuOpen, onClose]);

    const statusLine = chatState.isOtherUserTyping
        ? { label: "Typing…", tone: "text-primary", dot: "bg-primary animate-pulse" }
        : chatState.isOtherUserOnline
            ? { label: "Online", tone: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" }
            : { label: chat.unit, tone: "text-muted-foreground", dot: "bg-muted-foreground/40" };

    const headerLabel = chat.isMinimized ? `Expand chat with ${chat.name}` : `Collapse chat with ${chat.name}`;

    return (
        <motion.section
            ref={sectionRef}
            layout={!shouldReduceMotion}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.8 }}
            role="region"
            aria-label={`Chat with ${chat.name}`}
            data-active={chat.isActive ? "true" : "false"}
            onMouseDownCapture={activate}
            onFocusCapture={activate}
            style={{ width: WINDOW_WIDTH_PX, height: chat.isMinimized ? "auto" : WINDOW_HEIGHT_PX }}
            className={cn(
                "pointer-events-auto flex flex-col overflow-hidden rounded-t-2xl border border-b-0 bg-card text-foreground",
                "shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_-16px_48px_-12px_rgba(0,0,0,0.6)]",
                "transition-[box-shadow,border-color] duration-200",
                chat.isActive ? "border-primary/50 ring-1 ring-primary/30" : "border-border"
            )}
        >
            {/* Header */}
            <header
                className={cn(
                    "flex shrink-0 items-center gap-2 border-b px-2.5 py-2",
                    chat.isActive ? "border-primary/20 bg-primary/5" : "border-border/70 bg-card"
                )}
            >
                <button
                    type="button"
                    onClick={() => onToggleMinimize(chat.id)}
                    aria-expanded={!chat.isMinimized}
                    aria-label={headerLabel}
                    className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1 py-0.5 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                    <span className="relative shrink-0">
                        <span
                            className="block size-9 overflow-hidden rounded-full border border-border/70"
                            style={{ backgroundColor: getSafeAvatarBgColor(chat.avatarBgColor) }}
                        >
                            <Image src={chat.avatar} alt="" width={36} height={36} className="size-full object-cover" />
                        </span>
                        <span
                            className={cn(
                                "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card",
                                chatState.isOtherUserOnline ? "bg-emerald-500" : "bg-muted-foreground/40"
                            )}
                            aria-hidden="true"
                        />
                        {chat.pendingCount > 0 && (
                            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-card">
                                {chat.pendingCount > 9 ? "9+" : chat.pendingCount}
                                <span className="sr-only"> unread messages</span>
                            </span>
                        )}
                    </span>
                    <span className="flex min-w-0 flex-col">
                        <span className="flex min-w-0 items-center gap-1.5">
                            <span className="truncate text-sm font-bold leading-tight text-foreground">{chat.name}</span>
                            <RoleBadge role={chat.role} className="shrink-0" />
                        </span>
                        <span className={cn("flex items-center gap-1.5 text-[11px] font-medium leading-tight", statusLine.tone)}>
                            <span className={cn("size-1.5 rounded-full", statusLine.dot)} aria-hidden="true" />
                            <span className="truncate">{statusLine.label}</span>
                        </span>
                    </span>
                </button>

                <div className="flex shrink-0 items-center gap-0.5 text-muted-foreground">
                    <Tooltip content={chat.isMinimized ? "Expand" : "Minimize"} side="top">
                        <button
                            type="button"
                            onClick={() => onToggleMinimize(chat.id)}
                            aria-label={chat.isMinimized ? "Expand chat" : "Minimize chat"}
                            className="flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-muted hover:text-foreground"
                        >
                            {chat.isMinimized ? <ChevronUp className="size-4" aria-hidden="true" /> : <ChevronDown className="size-4" aria-hidden="true" />}
                        </button>
                    </Tooltip>

                    <DropdownMenu
                        open={isMenuOpen}
                        onOpenChange={(open) => {
                            setIsMenuOpen(open);
                            if (!open) setPendingConfirm(null);
                        }}
                    >
                        <Tooltip content="More options" side="top">
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    aria-label="Conversation options"
                                    className="flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground"
                                >
                                    {isBusy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <MoreHorizontal className="size-4" aria-hidden="true" />}
                                </button>
                            </DropdownMenuTrigger>
                        </Tooltip>
                        {/* The dock sits at z-[55]; the portaled menu must render above it. */}
                        <DropdownMenuContent align="end" sideOffset={6} className="z-[90] w-56 text-xs">
                            {pendingConfirm ? (
                                <div className="px-2 py-1.5">
                                    <p className="text-xs font-semibold text-foreground">
                                        {pendingConfirm === "block" ? `Block ${firstName}?` : "Archive this conversation?"}
                                    </p>
                                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                                        {pendingConfirm === "block"
                                            ? "They will no longer be able to message you. You can undo this from the full messaging page."
                                            : "It will be hidden from this list but kept on the full messaging page."}
                                    </p>
                                    <div className="mt-2 flex justify-end gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setPendingConfirm(null)}
                                            className="rounded-lg px-2.5 py-1.5 font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const action = pendingConfirm;
                                                setPendingConfirm(null);
                                                setIsMenuOpen(false);
                                                onMenuAction(chat, action);
                                            }}
                                            className={cn(
                                                "rounded-lg px-2.5 py-1.5 font-semibold text-white transition-colors",
                                                pendingConfirm === "block" ? "bg-red-600 hover:bg-red-700" : "bg-foreground text-background hover:opacity-90"
                                            )}
                                        >
                                            {pendingConfirm === "block" ? "Block" : "Archive"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <DropdownMenuItem
                                        disabled={!chat.participantUserId}
                                        onSelect={() => {
                                            if (chat.participantUserId) {
                                                openProfile(chat.participantUserId, { full_name: chat.name, avatar_url: chat.avatar, role: chat.role ?? undefined } as never);
                                            }
                                        }}
                                    >
                                        <UserRound className="mr-2 size-3.5" aria-hidden="true" /> View profile
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => onOpenSharedFiles(chat.id)}>
                                        <FolderOpen className="mr-2 size-3.5" aria-hidden="true" /> Shared files
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={`${messagesHref}?conversation=${chat.id}`}>
                                            <ExternalLink className="mr-2 size-3.5" aria-hidden="true" /> Open in Messages
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        disabled={isBusy}
                                        onSelect={(event) => {
                                            event.preventDefault();
                                            setPendingConfirm("archive");
                                        }}
                                    >
                                        <Archive className="mr-2 size-3.5" aria-hidden="true" /> Archive conversation
                                    </DropdownMenuItem>
                                    <DropdownMenuItem disabled={isBusy} onSelect={() => onMenuAction(chat, "report")}>
                                        <Flag className="mr-2 size-3.5" aria-hidden="true" /> Report contact
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        disabled={isBusy}
                                        className="text-red-600 focus:bg-red-500/10 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                                        onSelect={(event) => {
                                            event.preventDefault();
                                            setPendingConfirm("block");
                                        }}
                                    >
                                        <ShieldBan className="mr-2 size-3.5" aria-hidden="true" /> Block contact
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Tooltip content="Close" side="top">
                        <button
                            type="button"
                            onClick={() => onClose(chat.id)}
                            aria-label={`Close chat with ${chat.name}`}
                            className="flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <X className="size-4" aria-hidden="true" />
                        </button>
                    </Tooltip>
                </div>
            </header>

            {!chat.isMinimized && (
                <>
                    <MiniChatMessageList
                        contact={chat}
                        messages={chatState.messages}
                        isLoading={chatState.isLoading}
                        isOtherUserTyping={chatState.isOtherUserTyping}
                        error={chatState.error}
                        viewerRole={viewerRole}
                        onRetry={(messageId) => onRetry(chat.id, messageId)}
                        onDiscard={(messageId) => onDiscard(chat.id, messageId)}
                        onReload={() => onReload(chat.id)}
                        onDismissError={() => onDismissError(chat.id)}
                    />
                    <MiniChatComposer
                        draft={chatState.draft}
                        isSending={chatState.isSending}
                        isUploading={chatState.isUploading}
                        uploadProgress={chatState.uploadProgress}
                        disabled={chat.isBlocked}
                        autoFocus={chat.isActive}
                        contactName={chat.name}
                        onChange={(draft) => onDraftChange(chat.id, draft)}
                        onSend={() => onSend(chat.id)}
                        onAttach={(file) => onAttach(chat.id, file)}
                        onFocus={activate}
                    />
                </>
            )}
        </motion.section>
    );
}
