"use client";

import Image from 'next/image';
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
    Check, 
    CheckCheck, 
    Clock3, 
    AlertTriangle, 
    Receipt, 
    Wallet, 
    Search, 
    Download, 
    ShieldCheck, 
    HandCoins, 
    CheckCircle2, 
    Bell, 
    FileText, 
    Wrench, 
    CalendarClock,
    Paperclip,
    Image as ImageIcon,
    Zap,
    History,
    MoreVertical,
    Copy,
    TrendingUp
} from "lucide-react";
import { UiMessage, OutboundStatus } from "./types";
import { Logo } from "@/components/ui/Logo";
import { m as motion, AnimatePresence } from "framer-motion";
import { OfficialReceipt } from "@/components/messaging/OfficialReceipt";
import { NotificationCard } from "@/components/messaging/NotificationCard";

interface MessageBubbleProps {
    message: UiMessage;
    isMe: boolean;
    onDownloadImage?: (id: string, name: string) => void;
    onOpenF2F?: (message: UiMessage) => void;
    onImageClick?: (images: { url: string; id: string }[], index: number) => void;
    isDownloading?: boolean;
    viewerRole?: "landlord" | "tenant";
    onResolveIssue?: (message: UiMessage) => void;
    onReportMessage?: (id: string) => void;
    isActionDisabled?: boolean;
}

export function MessageBubble({ 
    message, 
    isMe, 
    onDownloadImage, 
    onOpenF2F,
    onImageClick,
    isDownloading,
    viewerRole = "landlord",
    onReportMessage,
    isActionDisabled = false,
    onResolveIssue
}: MessageBubbleProps) {
    const isSystem = message.type === "system";
    const [didCopy, setDidCopy] = useState(false);
    const [didCopyId, setDidCopyId] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState(false);

    if (isSystem) {
        return (
            <div className="flex w-full justify-center my-8 px-4">
                <SystemMessage 
                    message={message} 
                    viewerRole={viewerRole}
                    onDownloadImage={onDownloadImage}
                    onOpenF2F={onOpenF2F}
                    isDownloading={isDownloading}
                    isActionDisabled={isActionDisabled}
                    onResolveIssue={onResolveIssue}
                />
            </div>
        );
    }

    const hasMedia = message.isAlbum || message.messageType === "image";
    
    // Check if content is just a filename rather than a user-typed caption
    const isFilename = Boolean(
        message.content &&
        (
            message.content === message.fileName ||
            message.content === message.metadata?.fileName ||
            /\.(jpe?g|png|webp|gif|svg|pdf|docx?|xlsx?|pptx?|zip)$/i.test(message.content.trim())
        )
    );
    const hasCustomCaption = Boolean(message.content && !isFilename);
    const hasContent = (message.messageType === "file") || (message.messageType !== "image" && Boolean(message.content)) || (message.messageType === "image" && hasCustomCaption);
    const copyText = message.isRedacted ? (message.redactedContent || "••••••••") : (hasCustomCaption || message.messageType !== "image" ? message.content || "" : "");

    const handleCopy = async () => {
        if (!copyText) return;
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(copyText);
            } else {
                const el = document.createElement("textarea");
                el.value = copyText;
                el.setAttribute("readonly", "");
                el.style.cssText = "position: fixed; left: -9999px;";
                document.body.appendChild(el);
                el.select();
                document.execCommand("copy");
                document.body.removeChild(el);
            }
            setDidCopy(true);
            window.setTimeout(() => setDidCopy(false), 1200);
        } catch {
            // no-op: clipboard may be blocked by browser permission policy
        }
    };

    const handleCopyId = async () => {
        try {
            await navigator.clipboard.writeText(message.id);
            setDidCopyId(true);
            window.setTimeout(() => setDidCopyId(false), 1200);
        } catch { }
    };

    return (
        <div className={cn(
            "flex w-full mb-4 group items-center gap-2 relative",
            isMe ? "justify-end flex-row" : "justify-start flex-row"
        )}>
            {/* Outgoing Message Kebab Action Menu (on the left side of bubble) */}
            {isMe && (
                <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity self-center shrink-0 relative">
                    <button
                        type="button"
                        onClick={() => setShowActionsMenu(!showActionsMenu)}
                        onBlur={() => setTimeout(() => setShowActionsMenu(false), 200)}
                        className={cn(
                            "inline-flex items-center justify-center rounded-full p-1.5 transition-all text-medium hover:text-high hover:bg-surface-3 neumorphic-panel",
                            showActionsMenu && "bg-surface-3 text-high opacity-100"
                        )}
                        title="Message actions"
                    >
                        <MoreVertical className="size-3.5" />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                        {showActionsMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                className="absolute bottom-full z-50 mb-2 right-0 min-w-[140px] rounded-2xl neumorphic-panel p-1.5 shadow-xl"
                            >
                                {Boolean(copyText) && (
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-medium hover:bg-surface-2 hover:text-high transition-colors"
                                    >
                                        {didCopy ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
                                        {didCopy ? "Copied" : "Copy text"}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleCopyId}
                                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-medium hover:bg-surface-2 hover:text-high transition-colors"
                                >
                                    {didCopyId ? <Check className="size-3 text-primary" /> : <ShieldCheck className="size-3" />}
                                    {didCopyId ? "ID Copied" : "Copy ID"}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            <div className={cn(
                "max-w-[75%] md:max-w-[60%] flex flex-col",
                isMe ? "items-end" : "items-start"
            )}>
                {/* Media Section (Outside Bubble) */}
                {hasMedia && (
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={cn(
                            "w-full mb-1",
                            isMe ? "flex justify-end" : "flex justify-start"
                        )}
                    >
                        {message.isAlbum && message.attachments ? (
                            <div className="w-full max-w-[400px]">
                                <AlbumGrid attachments={message.attachments} isMe={isMe} onImageClick={onImageClick} />
                            </div>
                        ) : message.fileUrl ? (
                            <div
                                className="rounded-[2rem] overflow-hidden max-w-[320px] neumorphic-panel cursor-pointer hover:opacity-90 transition-opacity relative group/image"
                                onClick={() => onImageClick?.([{ url: message.fileUrl!, id: message.id }], 0)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onImageClick?.([{ url: message.fileUrl!, id: message.id }], 0); }}}
                                tabIndex={0}
                                role="button"
                            >
                                <Image 
                                    src={message.fileUrl} 
                                    alt={message.fileName || "Attachment"} 
                                    width={1200} 
                                    height={800} 
                                    className={cn("object-cover", message.status === "sending" && "opacity-90")} 
                                    style={{maxHeight: '400px', width: 'auto', height: 'auto'}} 
                                />
                                {message.status === "sending" && (
                                    <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-black shadow-lg">
                                            <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Sending…</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </motion.div>
                )}

                {/* Content Bubble (Text or File) */}
                {hasContent && (
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={cn(
                            "px-4 py-3 rounded-[1.5rem]",
                            isMe 
                                ? "neumorphic-primary text-white rounded-br-sm" 
                                : "neumorphic-panel text-high rounded-bl-sm",
                            hasMedia && "mt-1"
                        )}
                    >
                        {message.messageType === "file" && message.fileUrl ? (
                            <div className={cn(
                                "mb-2 flex items-center gap-3 p-3 rounded-xl",
                                isMe ? "bg-white/10 shadow-inner" : "neumorphic-inset-card"
                            )}>
                                <div className={cn(
                                    "p-2 rounded-lg",
                                    isMe ? "bg-white/20" : "bg-primary/10"
                                )}>
                                    <Paperclip className={cn("size-4", isMe ? "text-white" : "text-primary")} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black truncate">{message.fileName || "File Attachment"}</p>
                                    <p className={cn("text-[10px]", isMe ? "text-white/70" : "text-medium")}>
                                        {message.fileSize ? `${(message.fileSize / 1024).toFixed(1)} KB` : ""}
                                    </p>
                                </div>
                                <button className={cn(
                                    "p-1.5 rounded-lg transition-colors",
                                    isMe ? "hover:bg-white/20" : "hover:bg-surface-3"
                                )}>
                                    <Download className="size-3.5" />
                                </button>
                            </div>
                        ) : null}
                        
                        {(message.messageType !== "image" || hasCustomCaption) && message.content && (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {message.isRedacted ? (message.redactedContent || "••••••••") : message.content}
                            </p>
                        )}
                    </motion.div>
                )}
                
                {/* Timestamp & Delivery Status - Compact with zero middle gap */}
                <div className={cn(
                    "flex items-center gap-1.5 mt-1 px-1",
                    isMe ? "flex-row" : "flex-row"
                )}>
                    <span className="text-[10px] font-medium text-disabled">
                        {message.timestamp}
                    </span>
                    {isMe && <StatusIcon status={message.status} />}
                </div>
            </div>

            {/* Incoming Message Kebab Action Menu (on the right side of bubble) */}
            {!isMe && (
                <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity self-center shrink-0 relative">
                    <button
                        type="button"
                        onClick={() => setShowActionsMenu(!showActionsMenu)}
                        onBlur={() => setTimeout(() => setShowActionsMenu(false), 200)}
                        className={cn(
                            "inline-flex items-center justify-center rounded-full p-1.5 transition-all text-medium hover:text-high hover:bg-surface-3 neumorphic-panel",
                            showActionsMenu && "bg-surface-3 text-high opacity-100"
                        )}
                        title="Message actions"
                    >
                        <MoreVertical className="size-3.5" />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                        {showActionsMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                className="absolute bottom-full z-50 mb-2 left-0 min-w-[140px] rounded-2xl neumorphic-panel p-1.5 shadow-xl"
                            >
                                {Boolean(copyText) && (
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-medium hover:bg-surface-2 hover:text-high transition-colors"
                                    >
                                        {didCopy ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
                                        {didCopy ? "Copied" : "Copy text"}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleCopyId}
                                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-medium hover:bg-surface-2 hover:text-high transition-colors"
                                >
                                    {didCopyId ? <Check className="size-3 text-primary" /> : <ShieldCheck className="size-3" />}
                                    {didCopyId ? "ID Copied" : "Copy ID"}
                                </button>
                                {onReportMessage && (
                                    <button
                                        type="button"
                                        onClick={() => onReportMessage(message.id)}
                                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-colors"
                                    >
                                        <AlertTriangle className="size-3" />
                                        Report
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

function StatusIcon({ status }: { status?: OutboundStatus }) {
    switch (status) {
        case "sending": return <Clock3 className="size-2.5 text-disabled" />;
        case "sent": return <Check className="size-2.5 text-disabled" />;
        case "delivered": return <CheckCheck className="size-2.5 text-disabled" />;
        case "seen": return <CheckCheck className="size-2.5 text-primary" />;
        case "failed": return <AlertTriangle className="size-2.5 text-red-500" />;
        default: return <Check className="size-2.5 text-disabled" />;
    }
}

function AlbumGrid({ attachments, isMe, onImageClick }: { attachments: UiMessage[], isMe: boolean, onImageClick?: (images: { url: string; id: string }[], index: number) => void }) {
    const count = attachments.length;
    const visibleAttachments = attachments.slice(0, 4);
    const extraCount = count - 3;
    
    return (
        <div className={cn(
            "grid gap-1 rounded-[1.5rem] overflow-hidden neumorphic-panel",
            "grid-cols-2"
        )}>
            {visibleAttachments.map((att, idx) => {
                const isExtra = idx === 3 && count > 4;
                const isLarge = idx === 0 && count === 3;
                
                return (
                    <div
                        key={att.id || `album-att-${att.fileUrl || idx}-${idx}`}
                        className={cn(
                            "relative overflow-hidden aspect-square neumorphic-inset",
                            isLarge && "row-span-2 aspect-auto"
                        )}
                    >
                        {att.fileUrl && (
                            <Image
                                src={att.fileUrl}
                                fill
                                sizes="(max-width: 768px) 50vw, 33vw"
                                className={cn("object-cover", onImageClick && "cursor-pointer hover:opacity-90 transition-opacity")}
                                alt=""
                                onClick={() => onImageClick?.(attachments.map(a => ({ url: a.fileUrl!, id: a.id })), idx)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onImageClick?.(attachments.map(a => ({ url: a.fileUrl!, id: a.id })), idx); }}}
                                tabIndex={onImageClick ? 0 : -1}
                                role={onImageClick ? "button" : undefined}
                            />
                        )}
                        {isExtra && (
                            <div
                                className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px] cursor-pointer hover:bg-black/70 transition-colors"
                                onClick={() => onImageClick?.(attachments.map(a => ({ url: a.fileUrl!, id: a.id })), 3)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onImageClick?.(attachments.map(a => ({ url: a.fileUrl!, id: a.id })), 3); }}}
                                tabIndex={0}
                                role="button"
                            >
                                <span className="text-white text-xl font-black">+{extraCount}</span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// Helper to render icons based on system type
function renderSystemIcon(type: string) {
    switch (type) {
        case 'awaiting_in_person': return <HandCoins className="size-5" />;
        case 'reminder_sent': return <Bell className="size-5" />;
        case 'invoice': return <Receipt className="size-5" />;
        case 'landlord_review': return <History className="size-5" />;
        default: return <Zap className="size-5" />;
    }
}

function SystemMessage({ 
    message, 
    onDownloadImage,
    onOpenF2F,
    isDownloading,
    viewerRole,
    isActionDisabled,
    onResolveIssue
}: { 
    message: UiMessage, 
    onDownloadImage?: (id: string, name: string) => void,
    onOpenF2F?: (message: UiMessage) => void,
    isDownloading?: boolean,
    viewerRole?: "landlord" | "tenant",
    isActionDisabled?: boolean,
    onResolveIssue?: (message: UiMessage) => void
}) {
    const router = useRouter();
    const isLandlord = viewerRole === "landlord";

    // Invoice - Shared Official Receipt with real-time fetching
    if (message.systemType === "invoice") {
        return (
            <OfficialReceipt 
                message={message} 
                onDownload={onDownloadImage}
                isDownloading={isDownloading}
                role={viewerRole}
            />
        );
    }

    // Awaiting In-Person Payment
    if (message.systemType === "awaiting_in_person" || message.workflowStatus === "awaiting_in_person") {
        return (
            <NotificationCard
                message={message}
                icon={<HandCoins className="size-6" />}
                title={isLandlord ? "In-Person Payment" : "Payment Awaiting Collection"}
                subtitle={isLandlord ? "Verification Required" : "Face-to-Face Transaction"}
                variant="warning"
                actionLabel={isLandlord ? "Process Payment" : "View Invoice"}
                onAction={isLandlord ? () => onOpenF2F?.(message) : () => router.push(message.invoiceId ? `/tenant/payments/${message.invoiceId}/checkout` : "/tenant/payments")}
                disabled={isActionDisabled}
            />
        );
    }

    // Reminder Sent
    if (message.systemType === "reminder_sent") {
        return (
            <NotificationCard
                message={message}
                icon={<Bell className="size-6" />}
                title={isLandlord ? "Payment Reminder" : "Payment Request"}
                subtitle={isLandlord ? "Notification Sent" : "Action Required"}
                variant="default"
                actionLabel={!isLandlord ? "Pay Now" : undefined}
                onAction={!isLandlord ? () => router.push(message.invoiceId ? `/tenant/payments/${message.invoiceId}/checkout` : "/tenant/payments") : undefined}
                disabled={isActionDisabled}
            />
        );
    }

    // Landlord Review Actions
    if (message.systemType === "landlord_review") {
        const isRejected = message.workflowStatus === "rejected";
        const isOverpayment = message.issueType === "excessive_amount";
        
        return (
            <NotificationCard
                message={message}
                icon={isOverpayment ? <TrendingUp className="size-6" /> : (isRejected ? <AlertTriangle className="size-6" /> : <CheckCircle2 className="size-6" />)}
                title={isOverpayment 
                    ? (message.metadata?.isResolved 
                        ? "Reconciliation Complete"
                        : (isLandlord 
                            ? (message.metadata?.hasRefundDetails ? "Refund Details Available" : "Overpayment Detected")
                            : (message.metadata?.hasRefundDetails ? "Refund Details Shared" : "Excess Payment Received")))
                    : (isRejected 
                        ? (isLandlord ? "Payment Rejected" : "Payment Declined") 
                        : (isLandlord ? "Payment Confirmed" : "Payment Received"))
                }
                subtitle={isOverpayment 
                    ? (message.metadata?.isResolved
                        ? (isLandlord ? "Excess payment handled." : "Transaction fully settled.")
                        : (isLandlord 
                            ? (message.metadata?.hasRefundDetails ? "Tenant has submitted their refund preference." : `Reconciliation needed for ₱${Math.abs(Number(message.metadata?.shortfallAmount || 0)).toLocaleString()} excess`)
                            : (message.metadata?.hasRefundDetails ? "Awaiting landlord processing." : `We received ₱${Math.abs(Number(message.metadata?.shortfallAmount || 0)).toLocaleString()} more than the required amount.`))) 
                    : (isRejected ? "Action Logged" : "Transaction Complete")}
                variant={isOverpayment ? (message.metadata?.isResolved ? "success" : "warning") : (isRejected ? "error" : "success")}
                refundImg={message.metadata?.refundProofUrl}
                actionLabel={
                    message.metadata?.isResolved 
                        ? undefined 
                        : (isLandlord 
                            ? (message.metadata?.hasRefundDetails ? "View Refund Info" : "Reconcile")
                            : ((isRejected || (isOverpayment && !message.metadata?.hasRefundDetails)) ? "Resolve Issue" : undefined))
                }
                onAction={
                    message.metadata?.isResolved
                        ? undefined
                        : (isLandlord 
                            ? (message.metadata?.hasRefundDetails ? () => onOpenF2F?.(message) : undefined)
                            : ((isRejected || isOverpayment) ? () => onResolveIssue?.(message) : undefined))
                }
            />
        );
    }

    // Default Fallback System Card
    return (
        <NotificationCard
            message={message}
            icon={renderSystemIcon(message.systemType || "")}
            title="System Notification"
            subtitle={message.timestamp}
            variant="default"
        />
    );
}

