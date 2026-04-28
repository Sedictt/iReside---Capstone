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
    onImageClick?: (url: string) => void;
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
                                onClick={() => onImageClick?.(message.fileUrl!)}
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

function AlbumGrid({ attachments, isMe, onImageClick }: { attachments: UiMessage[], isMe: boolean, onImageClick?: (url: string) => void }) {
    const count = attachments.length;
    
    return (
        <div className={cn(
            "grid gap-1 rounded-[1.5rem] overflow-hidden border border-black/5 shadow-premium",
            count === 3 ? "grid-cols-2" : "grid-cols-2"
        )}>
            {attachments.slice(0, 4).map((att, idx) => {
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
                            onClick={() => onImageClick?.(att.fileUrl!)}
                        />
                        {isExtra && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                                <span className="text-white text-xl font-black">+{count - 3}</span>
                            </div>
                        )}
                    </div>
                );
            })}
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
    if (message.systemType === "payment_submitted") {
        return (
            <div className="flex justify-center w-full my-6 px-4">
                <div className="flex flex-col bg-surface-1 overflow-hidden border border-primary/20 rounded-3xl shadow-lg max-w-sm w-full transition-all hover:border-primary/40 group">
                    <div className="bg-gradient-to-r from-primary/80 to-primary p-5 flex items-center gap-3">
                        <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md border border-white/10">
                            <Receipt className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-white">
                            <p className="text-lg font-bold leading-tight">Payment Received</p>
                            <p className="text-[10px] font-bold tracking-wide uppercase opacity-70">{message.timestamp}</p>
                        </div>
                    </div>

                    <div className="p-5 flex flex-col gap-4">
                        <div className="flex justify-between items-center bg-surface-2 rounded-2xl p-4 border border-divider">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-wider text-medium font-bold mb-1">Amount Paid</span>
                                <span className="text-2xl font-black text-primary">₱{message.paymentAmount}</span>
                            </div>
                            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                                <Wallet className="h-4 w-4 text-primary" />
                            </div>
                        </div>

                        <p className="text-xs text-medium leading-relaxed bg-surface-2/50 p-3 rounded-xl border border-divider">
                            {message.content}
                        </p>

                        {message.receiptImg && (
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] uppercase tracking-wider text-medium font-bold ml-1">Proof of Payment</span>
                                <div className="rounded-2xl overflow-hidden border border-divider relative cursor-pointer shadow-inner aspect-[16/9]">
                                    <img src={message.receiptImg} alt="Receipt" className="w-full h-full object-cover opacity-90" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                        <Search className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <button
                            onClick={() => onConfirmPayment?.(message.invoiceId ?? message.paymentId ?? "")}
                            className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl text-sm font-bold transition-all shadow-md active:scale-[0.98]"
                        >
                            Verify & Confirm Payment
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (message.systemType === "invoice") {
        const invoiceId = `invoice-${message.id}`;
        return (
            <div className="flex justify-center w-full my-6 px-4">
                <div id={invoiceId} className="flex flex-col w-full max-w-md bg-surface-1 border border-divider rounded-3xl overflow-hidden shadow-xl">
                    <div className="bg-surface-2 p-6 border-b border-divider relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Receipt size={120} className="-rotate-12" />
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <Logo className="h-6 w-auto mb-1" />
                                <p className="text-[10px] text-medium font-bold uppercase tracking-widest">Digital Payment Invoice</p>
                            </div>
                            <div className="text-right">
                                <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                                    Status: Paid
                                </span>
                                <p className="text-[10px] text-medium mt-2 font-medium">{message.invoiceId}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[9px] text-medium uppercase font-bold tracking-wider mb-1">Billed To</p>
                                <p className="text-sm font-bold text-high leading-tight">{message.tenantName}</p>
                                <p className="text-[11px] text-medium mt-0.5">{message.unit}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] text-medium uppercase font-bold tracking-wider mb-1">Date Issued</p>
                                <p className="text-sm font-bold text-high leading-tight">{message.date}</p>
                            </div>
                        </div>

                        <div className="bg-surface-2/40 rounded-2xl border border-divider overflow-hidden">
                            <div className="p-3 border-b border-divider bg-surface-2/20 flex items-center justify-between">
                                <span className="text-[9px] text-medium uppercase font-bold tracking-wider px-1">Description</span>
                                <span className="text-[9px] text-medium uppercase font-bold tracking-wider px-1">Amount</span>
                            </div>
                            <div className="p-4 flex items-center justify-between">
                                <p className="text-xs text-high font-medium">{message.description}</p>
                                <p className="text-sm font-black text-high">₱{message.amount}</p>
                            </div>
                            <div className="px-4 py-3 bg-primary/5 flex items-center justify-between border-t border-divider">
                                <span className="text-[10px] text-medium font-bold uppercase tracking-widest">Total Paid</span>
                                <span className="text-lg font-black text-primary">₱{message.amount}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                disabled={isDownloading}
                                onClick={() => onDownloadImage?.(invoiceId, `Invoice-${message.invoiceId}`)}
                                className="flex-1 bg-surface-2 hover:bg-surface-3 text-high py-3 rounded-2xl text-[11px] font-bold transition-all border border-divider flex items-center justify-center gap-2"
                            >
                                <Download className="w-3.5 h-3.5" />
                                {isDownloading ? "Generating..." : "Download Image"}
                            </button>
                            <button className="w-12 h-12 bg-surface-2 hover:bg-surface-3 text-medium hover:text-high flex items-center justify-center rounded-2xl transition-all border border-divider">
                                <ShieldCheck className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (message.workflowStatus === "awaiting_in_person") {
        return (
            <div className="flex justify-center w-full my-6 px-4">
                <div className="flex flex-col bg-surface-1 overflow-hidden border border-amber-500/30 rounded-3xl shadow-lg max-w-sm w-full transition-all hover:border-amber-500/50 group">
                    <div className="bg-gradient-to-r from-amber-500/80 to-amber-600 p-5 flex items-center gap-3">
                        <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md border border-white/10">
                            <HandCoins className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-white">
                            <p className="text-lg font-bold leading-tight">In-Person Payment</p>
                            <p className="text-[10px] font-bold tracking-wide uppercase opacity-70">Awaiting Confirmation</p>
                        </div>
                    </div>

                    <div className="p-5 flex flex-col gap-4">
                        <div className="bg-surface-2/50 rounded-2xl p-4 border border-divider flex flex-col gap-3">
                            <p className="text-xs text-high font-medium leading-relaxed">
                                {message.content}
                            </p>
                            {message.expiresAt && (
                                <div className="flex items-center gap-2 text-[10px] text-amber-500 font-bold uppercase tracking-wider">
                                    <Clock3 className="w-3 h-3" />
                                    <span>Expires: {new Date(message.expiresAt).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                        
                        <button
                            onClick={() => onOpenF2F?.(message)}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 shadow-lg shadow-amber-500/20"
                        >
                            <HandCoins className="w-4 h-4" />
                            Open Cash Payment Interface
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Default system message style
    const getIcon = (type: string) => {
        switch (type) {
            case 'payment_submitted': return <FileText className="h-4 w-4 text-primary" />;
            case 'payment': return <CheckCircle2 className="h-4 w-4 text-primary" />;
            case 'invoice': return <Receipt className="h-4 w-4 text-emerald-500" />;
            case 'reminder_sent': return <Bell className="h-4 w-4 text-amber-500" />;
            case 'awaiting_in_person': return <HandCoins className="h-4 w-4 text-amber-500" />;
            case 'maintenance': return <Wrench className="h-4 w-4 text-amber-500" />;
            case 'maintenance_resolved': return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
            case 'lease': return <FileText className="h-4 w-4 text-purple-500" />;
            default: return <CalendarClock className="h-4 w-4 text-medium" />;
        }
    };

    return (
        <div className="flex justify-center w-full my-6 px-4">
            <div className={cn(
                "flex items-center gap-3 px-6 py-3 rounded-full border border-divider bg-surface-1 shadow-sm",
                message.workflowStatus === "confirmed" ? "border-emerald-500/20 bg-emerald-500/5" : 
                message.workflowStatus === "rejected" ? "border-red-500/20 bg-red-500/5" : ""
            )}>
                <div className="p-1.5 rounded-lg bg-surface-2 border border-divider">
                    {getIcon(message.systemType || "")}
                </div>
                <div className="flex flex-col">
                    <p className="text-xs font-bold text-high">{message.content}</p>
                    <p className="text-[10px] text-disabled font-medium uppercase tracking-wider">{message.timestamp}</p>
                </div>
            </div>
        </div>
    );
}
