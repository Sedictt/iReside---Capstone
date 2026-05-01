"use client";

import { cn } from "@/lib/utils";
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
    Copy
} from "lucide-react";
import { UiMessage, OutboundStatus } from "./types";
import { Logo } from "@/components/ui/Logo";
import { motion } from "framer-motion";
import { OfficialReceipt } from "@/components/messaging/OfficialReceipt";
import { NotificationCard } from "@/components/messaging/NotificationCard";

interface MessageBubbleProps {
    message: UiMessage;
    isMe: boolean;
    onConfirmPayment?: (id: string) => void;
    onDownloadImage?: (id: string, name: string) => void;
    onOpenF2F?: (message: UiMessage) => void;
    onImageClick?: (images: { url: string; id: string }[], index: number) => void;
    isDownloading?: boolean;
    viewerRole?: "landlord" | "tenant";
}

export function MessageBubble({ 
    message, 
    isMe, 
    onConfirmPayment, 
    onDownloadImage, 
    onOpenF2F,
    onImageClick,
    isDownloading,
    viewerRole = "landlord"
}: MessageBubbleProps) {
    const isSystem = message.type === "system";

    if (isSystem) {
        return (
            <div className="flex w-full justify-center my-8 px-4">
                <SystemMessage 
                    message={message} 
                    viewerRole={viewerRole}
                    onConfirmPayment={onConfirmPayment} 
                    onDownloadImage={onDownloadImage}
                    onOpenF2F={onOpenF2F}
                    isDownloading={isDownloading}
                />
            </div>
        );
    }

    const hasMedia = message.isAlbum || message.messageType === "image";
    const hasContent = Boolean(message.content) || message.messageType === "file";

    return (
        <div className={cn(
            "flex w-full mb-4",
            isMe ? "justify-end" : "justify-start"
        )}>
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
                                className="rounded-[2rem] overflow-hidden border border-black/10 shadow-sm max-w-[320px] bg-surface-2 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => onImageClick?.([{ url: message.fileUrl!, id: message.id }], 0)}
                            >
                                <img src={message.fileUrl} alt="Attachment" className="w-full h-auto object-cover max-h-[400px]" />
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
                            "px-4 py-3 rounded-[1.5rem] shadow-sm border",
                            isMe 
                                ? "bg-primary text-white border-primary/20 rounded-br-sm" 
                                : "bg-surface-1 text-high border-border rounded-bl-sm",
                            hasMedia && "mt-1"
                        )}
                    >
                        {message.messageType === "file" && message.fileUrl ? (
                            <div className={cn(
                                "mb-2 flex items-center gap-3 p-3 rounded-xl border",
                                isMe ? "bg-white/10 border-white/20" : "bg-surface-2 border-border"
                            )}>
                                <div className={cn(
                                    "p-2 rounded-lg",
                                    isMe ? "bg-white/20" : "bg-primary/10"
                                )}>
                                    <Paperclip className={cn("h-4 w-4", isMe ? "text-white" : "text-primary")} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate">{message.fileName || "File Attachment"}</p>
                                    <p className={cn("text-[10px]", isMe ? "text-white/70" : "text-medium")}>
                                        {message.fileSize ? `${(message.fileSize / 1024).toFixed(1)} KB` : ""}
                                    </p>
                                </div>
                                <button className={cn(
                                    "p-1.5 rounded-lg transition-colors",
                                    isMe ? "hover:bg-white/20" : "hover:bg-surface-3"
                                )}>
                                    <Download className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ) : null}
                        
                        {message.content && (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {message.isRedacted ? (message.redactedContent || "••••••••") : message.content}
                            </p>
                        )}
                    </motion.div>
                )}
                
                <div className="flex items-center gap-1.5 mt-1 px-1">
                    <span className="text-[10px] font-medium text-disabled">
                        {message.timestamp}
                    </span>
                    {isMe && <StatusIcon status={message.status} />}
                </div>
            </div>
        </div>
    );
}

function StatusIcon({ status }: { status?: OutboundStatus }) {
    switch (status) {
        case "sending": return <Clock3 className="h-2.5 w-2.5 text-disabled" />;
        case "sent": return <Check className="h-2.5 w-2.5 text-disabled" />;
        case "delivered": return <CheckCheck className="h-2.5 w-2.5 text-disabled" />;
        case "seen": return <CheckCheck className="h-2.5 w-2.5 text-primary" />;
        case "failed": return <AlertTriangle className="h-2.5 w-2.5 text-red-500" />;
        default: return <Check className="h-2.5 w-2.5 text-disabled" />;
    }
}

function AlbumGrid({ attachments, isMe, onImageClick }: { attachments: UiMessage[], isMe: boolean, onImageClick?: (images: { url: string; id: string }[], index: number) => void }) {
    const count = attachments.length;
    const visibleAttachments = attachments.slice(0, 4);
    const extraCount = count - 3;
    
    return (
        <div className={cn(
            "grid gap-1 rounded-[1.5rem] overflow-hidden border border-black/5 shadow-premium",
            "grid-cols-2"
        )}>
            {visibleAttachments.map((att, idx) => {
                const isExtra = idx === 3 && count > 4;
                const isLarge = idx === 0 && count === 3;
                
                return (
                    <div 
                        key={att.id} 
                        className={cn(
                            "relative overflow-hidden aspect-square bg-surface-3",
                            isLarge && "row-span-2 aspect-auto"
                        )}
                    >
                        <img 
                            src={att.fileUrl} 
                            className={cn("w-full h-full object-cover", onImageClick && "cursor-pointer hover:opacity-90 transition-opacity")} 
                            alt="" 
                            onClick={() => onImageClick?.(attachments.map(a => ({ url: a.fileUrl!, id: a.id })), idx)}
                        />
                        {isExtra && (
                            <div 
                                className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px] cursor-pointer hover:bg-black/70 transition-colors"
                                onClick={() => onImageClick?.(attachments.map(a => ({ url: a.fileUrl!, id: a.id })), 3)}
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
        case 'awaiting_in_person': return <HandCoins className="h-5 w-5" />;
        case 'reminder_sent': return <Bell className="h-5 w-5" />;
        case 'invoice': return <Receipt className="h-5 w-5" />;
        case 'landlord_review': return <History className="h-5 w-5" />;
        default: return <Zap className="h-5 w-5" />;
    }
}

function SystemMessage({ 
    message, 
    onConfirmPayment, 
    onDownloadImage,
    onOpenF2F,
    isDownloading,
    viewerRole
}: { 
    message: UiMessage, 
    onConfirmPayment?: (id: string) => void,
    onDownloadImage?: (id: string, name: string) => void,
    onOpenF2F?: (message: UiMessage) => void,
    isDownloading?: boolean,
    viewerRole?: "landlord" | "tenant"
}) {
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
                icon={<HandCoins className="h-6 w-6 text-white" />}
                title={isLandlord ? "In-Person Payment" : "Payment Awaiting Collection"}
                subtitle={isLandlord ? "Verification Required" : "Face-to-Face Transaction"}
                variant="warning"
                actionLabel={isLandlord ? "Confirm Payment" : undefined}
                onAction={isLandlord ? () => onOpenF2F?.(message) : undefined}
            />
        );
    }

    // Reminder Sent
    if (message.systemType === "reminder_sent") {
        return (
            <NotificationCard
                message={message}
                icon={<Bell className="h-6 w-6 text-white" />}
                title={isLandlord ? "Payment Reminder" : "Payment Request"}
                subtitle={isLandlord ? "Notification Sent" : "Action Required"}
                variant="default"
            />
        );
    }

    // Landlord Review Actions
    if (message.systemType === "landlord_review") {
        const isRejected = message.workflowStatus === "rejected";
        return (
            <NotificationCard
                message={message}
                icon={isRejected ? <AlertTriangle className="h-6 w-6 text-white" /> : <CheckCircle2 className="h-6 w-6 text-white" />}
                title={isRejected 
                    ? (isLandlord ? "Payment Rejected" : "Payment Declined") 
                    : (isLandlord ? "Payment Confirmed" : "Payment Received")
                }
                subtitle={isRejected ? "Action Logged" : "Transaction Complete"}
                variant={isRejected ? "error" : "success"}
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
