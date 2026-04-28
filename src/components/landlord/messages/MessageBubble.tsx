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
    Image as ImageIcon
} from "lucide-react";
import { UiMessage, OutboundStatus } from "./types";
import { Logo } from "@/components/ui/Logo";
import { motion } from "framer-motion";

interface MessageBubbleProps {
    message: UiMessage;
    isMe: boolean;
    onConfirmPayment?: (id: string) => void;
    onDownloadImage?: (id: string, name: string) => void;
    onOpenF2F?: (message: UiMessage) => void;
    onImageClick?: (images: { url: string; id: string }[], index: number) => void;
    isDownloading?: boolean;
}

export function MessageBubble({ 
    message, 
    isMe, 
    onConfirmPayment, 
    onDownloadImage, 
    onOpenF2F,
    onImageClick,
    isDownloading 
}: MessageBubbleProps) {
    const isSystem = message.type === "system";

    if (isSystem) {
        return <SystemMessage 
            message={message} 
            onConfirmPayment={onConfirmPayment} 
            onDownloadImage={onDownloadImage}
            onOpenF2F={onOpenF2F}
            isDownloading={isDownloading}
        />;
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
            count === 3 ? "grid-cols-2" : "grid-cols-2"
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

function NotificationCard({ 
    title, 
    content, 
    timestamp, 
    icon: Icon, 
    colorClass, 
    actionLabel, 
    actionIcon: ActionIcon,
    onAction,
    children,
    badge,
    metadata
}: { 
    title: string, 
    content: string, 
    timestamp: string, 
    icon: React.ElementType, 
    colorClass: 'emerald' | 'amber' | 'red' | 'blue' | 'purple' | 'primary' | 'neutral', 
    actionLabel?: string, 
    actionIcon?: React.ElementType,
    onAction?: () => void,
    children?: React.ReactNode,
    badge?: { label: string; color: string },
    metadata?: { label: string; value: string }[]
}) {
    const colorConfig = {
        emerald: {
            gradient: "from-emerald-500 to-emerald-600",
            bgLight: "bg-emerald-500/5",
            border: "border-emerald-500/20",
            borderHover: "hover:border-emerald-500/40",
            iconBg: "bg-emerald-500/10",
            iconColor: "text-emerald-500",
            badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        },
        amber: {
            gradient: "from-amber-500 to-amber-600",
            bgLight: "bg-amber-500/5",
            border: "border-amber-500/20",
            borderHover: "hover:border-amber-500/40",
            iconBg: "bg-amber-500/10",
            iconColor: "text-amber-500",
            badge: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        },
        red: {
            gradient: "from-red-500 to-red-600",
            bgLight: "bg-red-500/5",
            border: "border-red-500/20",
            borderHover: "hover:border-red-500/40",
            iconBg: "bg-red-500/10",
            iconColor: "text-red-500",
            badge: "bg-red-500/10 text-red-500 border-red-500/20",
        },
        blue: {
            gradient: "from-blue-500 to-blue-600",
            bgLight: "bg-blue-500/5",
            border: "border-blue-500/20",
            borderHover: "hover:border-blue-500/40",
            iconBg: "bg-blue-500/10",
            iconColor: "text-blue-500",
            badge: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        },
        purple: {
            gradient: "from-purple-500 to-purple-600",
            bgLight: "bg-purple-500/5",
            border: "border-purple-500/20",
            borderHover: "hover:border-purple-500/40",
            iconBg: "bg-purple-500/10",
            iconColor: "text-purple-500",
            badge: "bg-purple-500/10 text-purple-500 border-purple-500/20",
        },
        primary: {
            gradient: "from-primary to-primary",
            bgLight: "bg-primary/5",
            border: "border-primary/20",
            borderHover: "hover:border-primary/40",
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
            badge: "bg-primary/10 text-primary border-primary/20",
        },
        neutral: {
            gradient: "from-surface-3 to-surface-4",
            bgLight: "bg-surface-2/50",
            border: "border-divider",
            borderHover: "hover:border-medium/30",
            iconBg: "bg-surface-3",
            iconColor: "text-medium",
            badge: "bg-surface-2 text-medium border-divider",
        }
    };

    const colors = colorConfig[colorClass];

    return (
        <div className="flex justify-center w-full my-4 px-2">
            <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                    "w-full max-w-[380px] overflow-hidden rounded-3xl border bg-surface-1 shadow-lg transition-all hover:shadow-xl",
                    colors.border, colors.borderHover
                )}
            >
                {/* Header Section */}
                <div className={cn(
                    "relative px-5 py-4 flex items-center gap-4",
                    `bg-gradient-to-r ${colors.gradient}`
                )}>
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-10 w-12 h-12 bg-white/5 rounded-full translate-y-1/2" />
                    
                    <div className="relative flex-shrink-0">
                        <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/10">
                            <Icon className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    
                    <div className="relative flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white truncate">{title}</h3>
                            {badge && (
                                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", colors.badge)}>
                                    {badge.label}
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-white/70 font-medium">{timestamp}</p>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-5 space-y-4">
                    {/* Main content */}
                    <div className={cn("p-4 rounded-2xl border", colors.bgLight, colors.border)}>
                        <p className="text-sm text-high leading-relaxed font-medium">{content}</p>
                    </div>

                    {/* Metadata rows */}
                    {metadata && metadata.length > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                            {metadata.map((item, idx) => (
                                <div key={idx} className="p-3 rounded-xl bg-surface-2/50 border border-divider">
                                    <p className="text-[10px] uppercase tracking-wider text-disabled font-bold mb-1">{item.label}</p>
                                    <p className="text-sm font-bold text-high truncate">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Children (custom content) */}
                    {children}

                    {/* Action Button */}
                    {actionLabel && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onAction}
                            className={cn(
                                "w-full py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 border shadow-md active:shadow-sm",
                                colors.bgLight, colors.border, 
                                "hover:bg-surface-3 hover:border-medium/30"
                            )}
                        >
                            {ActionIcon && <ActionIcon className="w-4 h-4" />}
                            {actionLabel}
                        </motion.button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

function OfficialReceipt({ 
    message, 
    onDownload, 
    isDownloading 
}: { 
    message: UiMessage, 
    onDownload?: (id: string, name: string) => void,
    isDownloading?: boolean
}) {
    return (
        <div className="flex justify-center w-full my-8 px-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-[340px] bg-white text-slate-900 p-8 shadow-md border border-slate-200 font-mono relative overflow-hidden"
            >
                {/* Sublte paper texture effect */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                    style={{ 
                        backgroundImage: 'radial-gradient(circle, #000 0.5px, transparent 0.5px)',
                        backgroundSize: '100% 1.5px',
                        backgroundRepeat: 'repeat-y'
                    }} 
                />

                {/* Logo Area */}
                <div className="text-center mb-8 relative">
                    <h1 className="text-xl font-bold tracking-tighter mb-1">iReside</h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Payment Confirmation</p>
                </div>

                {/* Receipt Data */}
                <div className="space-y-3 text-[11px] relative">
                    <div className="flex justify-between gap-4">
                        <span className="shrink-0 opacity-60">Invoice #:</span>
                        <span className="text-right truncate max-w-[150px] font-bold">{message.invoiceId}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="shrink-0 opacity-60">Date:</span>
                        <span className="text-right font-bold">{message.date}</span>
                    </div>
                    
                    <div className="my-4 border-t border-slate-100" />

                    <div className="flex justify-between gap-4">
                        <span className="shrink-0 opacity-60">Tenant:</span>
                        <span className="text-right font-bold uppercase">{message.tenantName}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="shrink-0 opacity-60">Unit:</span>
                        <span className="text-right font-bold">{message.unit}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="shrink-0 opacity-60">Description:</span>
                        <span className="text-right font-bold">{message.description || "Rental Payment"}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="shrink-0 opacity-60">Status:</span>
                        <span className="px-1.5 py-0.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider">Paid</span>
                    </div>
                </div>

                {/* Separator */}
                <div className="my-6 border-t border-dashed border-slate-300 relative" />

                {/* Totals */}
                <div className="space-y-1 mb-8 relative">
                    <div className="flex justify-between text-sm font-black">
                        <span>TOTAL AMOUNT:</span>
                        <span>₱{message.amount}</span>
                    </div>
                </div>

                {/* Action / Footer */}
                <div className="pt-4 border-t-2 border-slate-900 space-y-4 relative">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-tight">Verified Digital Receipt</span>
                        </div>
                        <button
                            disabled={isDownloading}
                            onClick={() => onDownload?.(`invoice-${message.id}`, `Invoice-${message.invoiceId}`)}
                            className="text-[10px] font-black underline hover:no-underline uppercase tracking-tighter disabled:opacity-50"
                        >
                            {isDownloading ? "Saving..." : "Download PDF"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function SystemMessage({ 
    message, 
    onConfirmPayment, 
    onDownloadImage,
    onOpenF2F,
    isDownloading 
}: { 
    message: UiMessage, 
    onConfirmPayment?: (id: string) => void,
    onDownloadImage?: (id: string, name: string) => void,
    onOpenF2F?: (message: UiMessage) => void,
    isDownloading?: boolean
}) {
    // Invoice - Premium Receipt Style
    if (message.systemType === "invoice") {
        return (
            <OfficialReceipt 
                message={message} 
                onDownload={onDownloadImage}
                isDownloading={isDownloading}
            />
        );
    }

    // Payment Submitted
    if (message.systemType === "payment_submitted") {
        return (
            <NotificationCard
                title="Payment Received"
                content={message.content || ""}
                timestamp={message.timestamp}
                icon={Receipt}
                colorClass="primary"
                badge={{ label: "Success", color: "primary" }}
                actionLabel="Verify & Confirm"
                onAction={() => onConfirmPayment?.(message.invoiceId ?? message.paymentId ?? "")}
                metadata={[
                    { label: "Amount Paid", value: `₱${message.paymentAmount}` },
                    { label: "Method", value: "Online Transfer" },
                ]}
            >
                {message.receiptImg && (
                    <div className="mt-3">
                        <p className="text-[10px] uppercase tracking-wider text-disabled font-bold mb-2">Proof of Payment</p>
                        <div className="rounded-2xl overflow-hidden border border-divider relative cursor-pointer aspect-video group">
                            <img src={message.receiptImg} alt="Receipt" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <Search className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </NotificationCard>
        );
    }

    // Landlord Review (Confirmed/Rejected)
    if (message.systemType === "landlord_review") {
        const isRejected = message.workflowStatus === "rejected";
        return (
            <NotificationCard
                title={isRejected ? "Payment Rejected" : "Payment Confirmed"}
                content={message.content || ""}
                timestamp={message.timestamp}
                icon={isRejected ? AlertTriangle : CheckCircle2}
                colorClass={isRejected ? "red" : "emerald"}
                badge={{ label: isRejected ? "Rejected" : "Approved", color: isRejected ? "red" : "emerald" }}
                actionLabel="View Details"
                actionIcon={FileText}
            />
        );
    }

    // Payment Reminder
    if (message.systemType === "reminder_sent") {
        return (
            <NotificationCard
                title="Payment Reminder"
                content={message.content || ""}
                timestamp={message.timestamp}
                icon={Bell}
                colorClass="amber"
                badge={{ label: "Action Needed", color: "amber" }}
                actionLabel="View Invoice"
                actionIcon={Receipt}
                metadata={[
                    { label: "Invoice", value: message.invoiceNumber || message.invoiceId || 'N/A' },
                    { label: "Due Date", value: "See invoice details" },
                ]}
            />
        );
    }

    // Awaiting In-Person Payment
    if (message.workflowStatus === "awaiting_in_person") {
        return (
            <NotificationCard
                title="In-Person Payment"
                content={message.content || ""}
                timestamp={message.timestamp}
                icon={HandCoins}
                colorClass="amber"
                badge={{ label: "Pending", color: "amber" }}
                actionLabel="Open Payment Interface"
                actionIcon={Wallet}
                onAction={() => onOpenF2F?.(message)}
                metadata={message.expiresAt ? [
                    { label: "Expiry", value: new Date(message.expiresAt).toLocaleDateString() },
                    { label: "Status", value: "Awaiting Collection" },
                ] : undefined}
            />
        );
    }

    // Default Card for everything else (Maintenance, Lease, etc.)
    const getSystemMeta = (type: string) => {
        switch (type) {
            case 'maintenance': return { icon: Wrench, color: 'amber' as const, title: 'Maintenance Request', badge: 'Pending' };
            case 'maintenance_resolved': return { icon: CheckCircle2, color: 'blue' as const, title: 'Issue Resolved', badge: 'Completed' };
            case 'lease': return { icon: FileText, color: 'purple' as const, title: 'Lease Update', badge: 'New' };
            case 'in_person_intent_expired': return { icon: Clock3, color: 'red' as const, title: 'Payment Expired', badge: 'Expired' };
            default: return { icon: Bell, color: 'blue' as const, title: 'System Update', badge: 'Info' };
        }
    };

    const meta = getSystemMeta(message.systemType || "");

    return (
        <NotificationCard
            title={meta.title}
            content={message.content || ""}
            timestamp={message.timestamp}
            icon={meta.icon}
            colorClass={meta.color}
            badge={{ label: meta.badge, color: meta.color }}
            actionLabel="View Details"
            actionIcon={Search}
        />
    );
}
