"use client";

import { useState } from "react";
import {
    Search,
    MoreVertical,
    Send,
    Paperclip,
    Sparkles,
    ShieldCheck,
    Download,
    CheckCircle2,
    CalendarClock,
    Wrench,
    FileText,
    AlertTriangle,
    Receipt,
    Wallet,
    Image as ImageIcon,
    X,
    File,
    Folder,
    History,
    ArrowLeft,
    Zap,
    Phone,
    Hammer,
    CreditCard,
    Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Mock Data
const CONTACTS = [
    { id: "c1", name: "Marcus Johnson", unit: "Unit 102", unread: 2, lastContact: "10:42 AM", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80" },
    { id: "c2", name: "Sarah Wilson", unit: "Studio A", unread: 0, lastContact: "Yesterday", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80" },
    { id: "c3", name: "Alex Reyes", unit: "Unit 201", unread: 0, lastContact: "Tuesday", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" }
];

const MESSAGES = [
    { id: "m1", type: "system", systemType: "lease", content: "Lease Agreement signed digitally by Marcus Johnson.", timestamp: "Feb 1, 2026, 09:00 AM" },
    { id: "m2", type: "tenant", content: "Hi! I just moved in. Everything looks great, but I noticed the bathroom sink drains a little slowly.", timestamp: "Feb 2, 2026, 10:30 AM" },
    { id: "m3", type: "landlord", content: "Welcome, Marcus! I'm glad you're settling in. I'll have maintenance take a look at the sink drain this afternoon.", timestamp: "Feb 2, 2026, 10:45 AM" },
    { id: "m4", type: "system", systemType: "maintenance", content: "Maintenance Request #M-104 'Bathroom Sink Drain' created by System.", timestamp: "Feb 2, 2026, 10:45 AM" },
    { id: "m5", type: "system", systemType: "maintenance_resolved", content: "Maintenance Request #M-104 resolved successfully.", timestamp: "Feb 2, 2026, 03:20 PM" },
    { id: "m6", type: "tenant", content: "They fixed it, works perfectly now. Thank you!", timestamp: "Feb 2, 2026, 04:10 PM" },
    { id: "m7", type: "system", systemType: "payment_submitted", paymentAmount: "13,000", receiptImg: "https://images.unsplash.com/photo-1554224155-1696413565d3?auto=format&fit=crop&w=400&q=80", content: "Marcus Johnson submitted a rent payment of ₱13,000 via GCash for Rent (February).", timestamp: "Feb 28, 2026, 08:15 AM" },
    { id: "m8", type: "tenant", content: "Just sent over the rent for this month. Have a great week!", timestamp: "Feb 28, 2026, 08:20 AM" },
    { id: "m9", type: "landlord", content: "Received with thanks, Marcus. Enjoy your week as well.", timestamp: "Feb 28, 2026, 09:00 AM" }
];

export default function MessagesPage() {
    const [activeContact, setActiveContact] = useState(CONTACTS[0]);
    const [irisAssistActive, setIrisAssistActive] = useState(false);
    const [messagesState, setMessagesState] = useState<any[]>(MESSAGES);
    const [messageInput, setMessageInput] = useState("");
    const [showInfoSidebar, setShowInfoSidebar] = useState(false);
    const [showFilesSidebar, setShowFilesSidebar] = useState(false);
    const [fileFilter, setFileFilter] = useState("all");
    const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadImage = async (elementId: string, filename: string) => {
        try {
            setIsDownloading(true);
            const domtoimage = (await import('dom-to-image')).default;
            const element = document.getElementById(elementId);
            if (!element) return;

            // Adding a small delay helps ensure all internal fonts/rendering is complete
            await new Promise(resolve => setTimeout(resolve, 100));

            const dataUrl = await domtoimage.toPng(element, {
                bgcolor: '#0a0a0a',
                height: element.offsetHeight,
                width: element.offsetWidth,
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left'
                }
            });

            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error("Failed to generate image", error);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleSendMessage = () => {
        if (!messageInput.trim()) return;

        // Improved regex to capture the actual sensitive data following the keyword, e.g. "password is 1234" -> captures "1234"
        const regex = /(?:gcash|password|account|pin|bank|credit card)[\s:=]+([a-zA-Z0-9_-]+)|\b(\d{4}[-\s]?\d{4})\b|\b(09\d{9})\b/i;
        const match = messageInput.match(regex);

        // Match[1] is the text after keyword, Match[2]/[3] are the raw numbers
        const sensitiveString = match ? (match[1] || match[2] || match[3] || match[0]) : null;
        const isSensitive = !!match;

        const newMessage = {
            id: `m_${Date.now()}`,
            type: "landlord",
            content: messageInput,
            sensitiveMatch: sensitiveString,
            timestamp: "Just now",
            isRedacted: isSensitive,
            isConfirmedDisclosed: false
        };

        setMessagesState(prev => [...prev, newMessage]);
        setMessageInput("");
        setIrisAssistActive(false);
    };

    const confirmDisclose = (id: string) => {
        setMessagesState(prev => prev.map(m =>
            m.id === id ? { ...m, isConfirmedDisclosed: true } : m
        ));
    };

    const handleConfirmPayment = (id: string, amount?: string) => {
        const timestamp = new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        setMessagesState(prev => {
            const updated = prev.map(m =>
                m.id === id ? {
                    ...m,
                    systemType: "payment",
                    content: `${activeContact.name} successfully paid ₱${amount || "13,000"} for Rent (February). Receipt ID: #PAY-${Math.floor(Math.random() * 10000)}.`
                } : m
            );

            const invoiceId = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
            const invoiceMessage = {
                id: `inv_${Date.now()}`,
                type: "system",
                systemType: "invoice",
                invoiceId: invoiceId,
                tenantName: activeContact.name,
                unit: activeContact.unit,
                amount: amount || "13,000",
                date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                description: "Monthly Rent - February 2026",
                content: "Official Electronic Invoice Generated",
                timestamp: timestamp
            };

            return [...updated, invoiceMessage];
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const renderSystemIcon = (type: string) => {
        switch (type) {
            case 'payment_submitted': return <FileText className="h-4 w-4 text-primary" />;
            case 'payment': return <CheckCircle2 className="h-4 w-4 text-primary" />;
            case 'invoice': return <Receipt className="h-4 w-4 text-emerald-500" />;
            case 'maintenance': return <Wrench className="h-4 w-4 text-amber-500" />;
            case 'maintenance_resolved': return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
            case 'lease': return <FileText className="h-4 w-4 text-purple-500" />;
            default: return <CalendarClock className="h-4 w-4 text-neutral-500" />;
        }
    };

    return (
        <div className="flex h-full w-full bg-[#0a0a0a] text-white overflow-hidden p-6 gap-6 animate-in fade-in duration-700">
            {/* Sidebar Contact List */}
            <div className="w-80 lg:w-96 rounded-2xl border border-white/5 bg-neutral-900/50 flex flex-col shrink-0 h-full overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-white/5 shrink-0 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/landlord/dashboard"
                            className="bg-neutral-800 hover:bg-white/10 p-2 rounded-xl border border-white/10 transition-colors"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft className="w-4 h-4 text-neutral-300" />
                        </Link>
                        <h2 className="text-xl font-bold text-white leading-none mt-0.5">Messages</h2>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search tenants or messages..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary transition-all"
                        />
                    </div>
                </div>

                {/* Contacts */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                    {CONTACTS.map(contact => (
                        <button
                            key={contact.id}
                            onClick={() => setActiveContact(contact)}
                            className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left",
                                activeContact.id === contact.id ? "bg-white/10 border border-white/10" : "hover:bg-white/[0.03] border border-transparent"
                            )}
                        >
                            <div className="relative shrink-0">
                                <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                                {contact.unread > 0 && (
                                    <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-[#0a0a0a] flex items-center justify-center">
                                        <span className="text-[9px] font-bold text-white">{contact.unread}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <h4 className="font-bold text-white text-sm truncate pr-2">{contact.name}</h4>
                                    <span className="text-[10px] text-neutral-500 shrink-0">{contact.lastContact}</span>
                                </div>
                                <p className="text-xs text-neutral-400 font-medium truncate">{contact.unit}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full rounded-2xl border border-white/5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/40 via-[#0a0a0a] to-[#0a0a0a] overflow-hidden shadow-2xl">
                {/* Chat Header */}
                <div className="h-20 border-b border-white/5 px-6 flex items-center justify-between shrink-0 bg-neutral-900/20 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4">
                        <img src={activeContact.avatar} alt={activeContact.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                        <div>
                            <h3 className="font-bold text-white text-base">{activeContact.name}</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-neutral-400 font-medium">{activeContact.unit}</span>
                                <span className="w-1 h-1 rounded-full bg-neutral-600"></span>
                                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                <span className="text-[10px] text-emerald-500 tracking-wide">Encrypted Audit Trail Active</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-neutral-300 text-xs font-medium">
                            <Download className="w-4 h-4" />
                            <span className="hidden md:inline">Export Audit Log</span>
                        </button>
                        <button className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                            <Search className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                                setShowFilesSidebar(!showFilesSidebar);
                                setShowInfoSidebar(false);
                            }}
                            className={cn(
                                "p-2 hover:text-white rounded-lg transition-colors",
                                showFilesSidebar ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5"
                            )}
                            title="Shared Files"
                        >
                            <Folder className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                                setShowInfoSidebar(!showInfoSidebar);
                                setShowFilesSidebar(false);
                            }}
                            className={cn(
                                "p-2 hover:text-white rounded-lg transition-colors",
                                showInfoSidebar ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5"
                            )}
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative flex justify-center w-full">
                    <div className="w-full max-w-4xl p-6 space-y-6">
                        <div className="text-center py-4">
                            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest bg-neutral-900 px-4 py-1.5 rounded-full border border-white/5 shadow-sm">
                                Conversation Started • February 1, 2026
                            </span>
                        </div>

                        {messagesState.map((msg) => {
                            if (msg.type === "system") {
                                return (
                                    <div key={msg.id} className="flex justify-center max-w-4xl mx-auto my-6 px-4">
                                        {msg.systemType === "payment_submitted" ? (
                                            <div className="flex flex-col gap-0 bg-neutral-900 overflow-hidden border border-primary/30 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-primary/10 max-w-sm w-full transition-all hover:border-primary/50 hover:shadow-primary/20 group pb-4">
                                                {/* Header Gradient */}
                                                <div className="bg-gradient-to-r from-primary/80 to-primary p-5 relative overflow-hidden h-24 flex items-center shrink-0">
                                                    <div className="absolute top-0 right-0 -mt-4 -mr-4 bg-white/20 w-24 h-24 rounded-full blur-2xl"></div>
                                                    <div className="relative z-10 flex items-center gap-3">
                                                        <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md shadow-sm border border-white/10">
                                                            <Receipt className="h-6 w-6 text-black" />
                                                        </div>
                                                        <div className="text-left flex flex-col justify-center text-black">
                                                            <p className="text-lg font-bold leading-tight">Payment Received</p>
                                                            <p className="text-[10px] font-bold tracking-wide uppercase opacity-70">{msg.timestamp}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Details Section */}
                                                <div className="px-5 pt-5 pb-2 flex flex-col gap-4">
                                                    <div className="flex justify-between items-center bg-black/30 rounded-2xl p-4 border border-white/5">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Amount Paid</span>
                                                            <span className="text-2xl font-black text-primary">₱{msg.paymentAmount}</span>
                                                        </div>
                                                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                                                            <Wallet className="h-4 w-4 text-primary" />
                                                        </div>
                                                    </div>

                                                    <p className="text-xs text-neutral-400 leading-relaxed bg-neutral-800/30 p-3 rounded-xl border border-white/5">
                                                        {msg.content}
                                                    </p>

                                                    {msg.receiptImg && (
                                                        <div className="flex flex-col gap-2 mt-1">
                                                            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold ml-1">Proof of Payment</span>
                                                            <div className="rounded-2xl overflow-hidden border border-white/10 relative cursor-pointer shadow-inner">
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm z-10 group/img">
                                                                    <div className="bg-white/10 border border-white/20 p-2 rounded-full transform scale-95 group-hover/img:scale-100 transition-all">
                                                                        <Search className="w-5 h-5 text-white" />
                                                                    </div>
                                                                </div>
                                                                <img src={msg.receiptImg} alt="Receipt" className="w-full h-32 object-cover opacity-90 transition-opacity" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Button */}
                                                <div className="px-5 mt-2">
                                                    <button
                                                        onClick={() => handleConfirmPayment(msg.id, msg.paymentAmount)}
                                                        className="w-full bg-primary hover:bg-primary/90 text-black py-3 rounded-xl text-sm font-bold transition-all hover:shadow-[0_0_20px_rgba(200,255,0,0.15)] transform hover:-translate-y-0.5"
                                                    >
                                                        Verify  & Confirm Payment
                                                    </button>
                                                </div>
                                            </div>
                                        ) : msg.systemType === "invoice" ? (
                                            <div id={`invoice-${msg.id}`} className="flex flex-col w-full max-w-md bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
                                                {/* Invoice Watermark Header */}
                                                <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 p-6 border-b border-white/5 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                                        <Receipt size={120} className="-rotate-12" />
                                                    </div>
                                                    <div className="relative z-10 flex justify-between items-start">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                                                                    <div className="w-3 h-3 bg-black rounded-sm rotate-45" />
                                                                </div>
                                                                <h2 className="text-primary font-black tracking-tighter text-lg italic">iReside</h2>
                                                            </div>
                                                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Digital Payment Invoice</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                                                                Status: Paid
                                                            </span>
                                                            <p className="text-[10px] text-neutral-400 mt-2 font-medium">{msg.invoiceId}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Invoice Content */}
                                                <div className="p-6 space-y-6">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider mb-1">Billed To</p>
                                                            <p className="text-sm font-bold text-white leading-tight">{msg.tenantName}</p>
                                                            <p className="text-[11px] text-neutral-400 mt-0.5">{msg.unit}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider mb-1">Date Issued</p>
                                                            <p className="text-sm font-bold text-white leading-tight">{msg.date}</p>
                                                        </div>
                                                    </div>

                                                    <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                                                        <div className="p-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                                            <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider px-1">Description</span>
                                                            <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider px-1">Amount</span>
                                                        </div>
                                                        <div className="p-4 flex items-center justify-between">
                                                            <p className="text-xs text-neutral-300 font-medium">{msg.description}</p>
                                                            <p className="text-sm font-black text-white">₱{msg.amount}</p>
                                                        </div>
                                                        <div className="px-4 py-3 bg-primary/5 flex items-center justify-between border-t border-white/5">
                                                            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Total Paid</span>
                                                            <span className="text-lg font-black text-primary">₱{msg.amount}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            disabled={isDownloading}
                                                            onClick={() => handleDownloadImage(`invoice-${msg.id}`, `Invoice-${msg.invoiceId}`)}
                                                            className={cn(
                                                                "flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-2xl text-[11px] font-bold transition-all border border-white/5 flex items-center justify-center gap-2 group",
                                                                isDownloading && "opacity-50 cursor-not-allowed"
                                                            )}
                                                        >
                                                            <Download className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-colors" />
                                                            {isDownloading ? "Generating..." : "Download Image"}
                                                        </button>
                                                        <button className="w-12 h-12 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center rounded-2xl transition-all border border-white/5">
                                                            <ShieldCheck className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="px-6 py-3 bg-neutral-900 border-t border-white/5 text-center">
                                                    <p className="text-[9px] text-neutral-600 font-medium tracking-wide">Securely generated by iReside Iris Intelligence System</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 bg-neutral-900/60 border border-white/5 backdrop-blur-sm px-5 py-3 rounded-2xl shadow-sm text-center">
                                                <div className="bg-black/50 p-2 rounded-full border border-white/5 shrink-0">
                                                    {renderSystemIcon(msg.systemType || '')}
                                                </div>
                                                <div className="text-left flex flex-col justify-center">
                                                    <p className="text-xs text-neutral-300 font-medium leading-relaxed">{msg.content}</p>
                                                    <p className="text-[9px] text-neutral-500 mt-0.5 tracking-wider uppercase">{msg.timestamp}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            const isMe = msg.type === "landlord";

                            return (
                                <div key={msg.id} className={cn("flex flex-col w-full gap-1.5 mb-2", isMe ? "items-end" : "items-start")}>
                                    <div className="flex items-end gap-3 w-full justify-end max-w-full" style={{ justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                        {!isMe && (
                                            <img src={activeContact.avatar} className="w-8 h-8 rounded-full border border-white/10 shrink-0" alt="avatar" />
                                        )}
                                        <div className={cn(
                                            "px-5 py-3.5 max-w-[85%] sm:max-w-[70%] shadow-lg relative group transition-all duration-500",
                                            isMe
                                                ? "bg-primary text-black rounded-3xl rounded-br-sm font-medium"
                                                : "bg-neutral-800 text-white rounded-3xl rounded-bl-sm border border-white/5"
                                        )}>
                                            <span className={cn(
                                                "absolute -bottom-5 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity",
                                                isMe ? "right-1 text-neutral-500" : "left-1 text-neutral-500"
                                            )}>
                                                {msg.timestamp}
                                            </span>
                                            <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                                {msg.isRedacted && !msg.isConfirmedDisclosed
                                                    ? (msg.sensitiveMatch ? msg.content.replace(msg.sensitiveMatch, '█'.repeat(msg.sensitiveMatch.length)) : msg.content)
                                                    : msg.content
                                                }
                                            </div>
                                        </div>
                                    </div>

                                    {msg.isRedacted && !msg.isConfirmedDisclosed && (
                                        <div className="w-full flex justify-center mt-2 mb-4">
                                            <div className="max-w-[75%] sm:max-w-[60%] text-[11px] text-neutral-300 bg-neutral-900/60 p-4 rounded-3xl border border-amber-500/20 backdrop-blur-md shadow-lg shadow-amber-500/5 text-center">
                                                <div className="flex items-center justify-center gap-1.5 mb-2">
                                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                    <strong className="text-amber-500 text-xs">Iris AI Intercepted</strong>
                                                </div>
                                                <p className="leading-relaxed opacity-90 text-neutral-400">
                                                    This message contains sensitive credentials. If you proceed to disclose this, iReside will not be held accountable for any resulting damages (see Terms & Conditions).
                                                </p>
                                                <div className="mt-4 flex items-center justify-center">
                                                    <button
                                                        onClick={() => confirmDisclose(msg.id)}
                                                        className="px-6 py-2 bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:scale-105 font-bold rounded-xl transition-all w-fit"
                                                    >
                                                        Confirm & Disclose
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-4 md:p-6 bg-neutral-900/50 border-t border-white/5 shrink-0 flex justify-center w-full">
                    <div className="w-full max-w-4xl flex flex-col gap-3">
                        {/* Security Announcement Banner */}
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 flex items-center gap-3 shrink-0 mb-1">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                            <span className="text-xs font-medium text-amber-400/90">
                                <strong className="text-amber-500 mr-1">Security Warning:</strong>
                                Never share sensitive credentials, bank details, or passwords in this chat. Admins will NEVER ask for this information.
                            </span>
                        </div>

                        {/* Iris Assist Suggestions (expandable) */}
                        {irisAssistActive && (
                            <div className="flex flex-wrap gap-2 pt-1 pb-3 pl-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {[
                                    "Acknowledge receipt of payment",
                                    "Provide maintenance schedule",
                                    "Send late payment notice",
                                    "Draft routine inspection notice"
                                ].map((suggestion, idx) => (
                                    <button key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-xs font-medium text-blue-400 transition-colors">
                                        <Sparkles className="w-3 h-3" />
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex items-end gap-3 rounded-3xl bg-black/40 border border-white/10 p-2 pl-4 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
                            <textarea
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                className="w-full bg-transparent border-none focus:outline-none text-sm text-white placeholder:text-neutral-500 resize-none max-h-32 py-2.5 custom-scrollbar"
                                rows={1}
                            />
                            <div className="flex items-center gap-1 shrink-0 pb-1">
                                <button
                                    onClick={() => setIrisAssistActive(!irisAssistActive)}
                                    className={cn(
                                        "p-2 rounded-xl transition-all duration-300",
                                        irisAssistActive
                                            ? "bg-blue-500 text-black shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                                            : "text-blue-400 hover:bg-white/10"
                                    )}
                                    title="Iris AI Assist"
                                >
                                    <Sparkles className="w-5 h-5" />
                                </button>
                                <button className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleSendMessage}
                                    className="p-2 bg-primary text-black hover:bg-primary/90 hover:scale-105 rounded-xl transition-all shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between px-2">
                            <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> All messages are recorded for legal compliance and auditing.
                            </span>
                            <span className="text-[10px] text-neutral-500">Press Enter to send, Shift + Enter for new line</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Info Sidebar (Slide out panel) */}
            {showInfoSidebar && (
                <div className="w-72 shrink-0 rounded-2xl border border-white/5 bg-neutral-900/50 flex flex-col h-full overflow-hidden shadow-2xl animate-in slide-in-from-right-8 duration-300">
                    <div className="h-20 border-b border-white/5 px-6 flex items-center justify-between shrink-0 bg-neutral-900/30">
                        <h3 className="font-bold text-white">Details</h3>
                        <button
                            onClick={() => setShowInfoSidebar(false)}
                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                        {/* Quick Actions */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-bold text-neutral-300 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-primary" /> Quick Actions
                                </h4>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button className="flex flex-col items-center justify-center gap-2 p-3 bg-neutral-800/50 hover:bg-neutral-800 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
                                    <div className="bg-emerald-500/10 p-2 rounded-lg group-hover:scale-110 transition-transform">
                                        <CreditCard className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <span className="text-[10px] text-neutral-400 group-hover:text-white font-medium text-center leading-tight">Request<br />Payment</span>
                                </button>
                                <button className="flex flex-col items-center justify-center gap-2 p-3 bg-neutral-800/50 hover:bg-neutral-800 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
                                    <div className="bg-amber-500/10 p-2 rounded-lg group-hover:scale-110 transition-transform">
                                        <Hammer className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <span className="text-[10px] text-neutral-400 group-hover:text-white font-medium text-center leading-tight">Schedule<br />Repair</span>
                                </button>
                                <button className="flex flex-col items-center justify-center gap-2 p-3 bg-neutral-800/50 hover:bg-neutral-800 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
                                    <div className="bg-blue-500/10 p-2 rounded-lg group-hover:scale-110 transition-transform">
                                        <FileText className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <span className="text-[10px] text-neutral-400 group-hover:text-white font-medium text-center leading-tight">View<br />Lease</span>
                                </button>
                                <button className="flex flex-col items-center justify-center gap-2 p-3 bg-neutral-800/50 hover:bg-neutral-800 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
                                    <div className="bg-purple-500/10 p-2 rounded-lg group-hover:scale-110 transition-transform">
                                        <Bell className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <span className="text-[10px] text-neutral-400 group-hover:text-white font-medium text-center leading-tight">Send<br />Notice</span>
                                </button>
                            </div>
                        </div>



                        {/* Payment History Section */}
                        <div className="pb-4">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-bold text-neutral-300 flex items-center gap-2">
                                    <History className="w-4 h-4 text-primary" /> Payment History
                                </h4>
                                <button
                                    onClick={() => setShowPaymentHistoryModal(true)}
                                    className="text-[10px] uppercase font-bold text-neutral-500 cursor-pointer hover:text-white transition-colors"
                                >
                                    View All
                                </button>
                            </div>
                            <div className="flex flex-col gap-3 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/5 before:to-transparent">

                                <div className="relative flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-5 w-5 rounded-full bg-neutral-900 border-2 border-primary flex items-center justify-center relative z-10 shadow-[0_0_10px_rgba(200,255,0,0.2)]">
                                            <div className="h-1.5 w-1.5 bg-primary rounded-full"></div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-white">February Rent</span>
                                            <span className="text-[10px] text-primary">Pending Verification</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-white">₱13,000</span>
                                </div>

                                <div className="relative flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-5 w-5 rounded-full bg-neutral-900 border-2 border-white/20 flex items-center justify-center relative z-10">
                                            <CheckCircle2 className="w-3 h-3 text-neutral-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-neutral-300">January Rent</span>
                                            <span className="text-[10px] text-neutral-500">Jan 1, 2026</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-neutral-400">₱13,000</span>
                                </div>

                                <div className="relative flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-5 w-5 rounded-full bg-neutral-900 border-2 border-white/20 flex items-center justify-center relative z-10">
                                            <CheckCircle2 className="w-3 h-3 text-neutral-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-neutral-300">Security Deposit</span>
                                            <span className="text-[10px] text-neutral-500">Dec 28, 2025</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-neutral-400">₱26,000</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Shared Files Sidebar (Slide out panel) */}
            {showFilesSidebar && (
                <div className="w-80 shrink-0 rounded-2xl border border-white/5 bg-neutral-900/50 flex flex-col h-full overflow-hidden shadow-2xl animate-in slide-in-from-right-8 duration-300">
                    {/* Header */}
                    <div className="h-20 border-b border-white/5 px-6 flex items-center justify-between shrink-0 bg-neutral-900/40 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Folder size={80} className="-rotate-12" />
                        </div>
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                                <Folder className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-base">Shared Files</h3>
                                <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">12 Items • 34 MB</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowFilesSidebar(false)}
                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors relative z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Filter Tabs */}
                    <div className="px-6 py-4 border-b border-white/5 shrink-0">
                        <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
                            {['all', 'media', 'docs'].map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setFileFilter(filter)}
                                    className={cn(
                                        "flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all",
                                        fileFilter === filter
                                            ? "bg-white/10 text-white shadow-sm"
                                            : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5"
                                    )}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                        {/* Media Section */}
                        {(fileFilter === 'all' || fileFilter === 'media') && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-bold text-neutral-300 flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4 text-blue-400" /> Recent Media
                                    </h4>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { src: "https://images.unsplash.com/photo-1554224155-1696413565d3?auto=format&fit=crop&w=150&q=80", type: "img" },
                                        { src: "https://images.unsplash.com/photo-1588600878108-578307a3cc9d?auto=format&fit=crop&w=150&q=80", type: "img" },
                                        { src: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=150&q=80", type: "img" },
                                        { src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=150&q=80", type: "img" },
                                    ].map((img, idx) => (
                                        <div key={idx} className="group relative rounded-2xl overflow-hidden border border-white/10 aspect-square cursor-pointer bg-neutral-800">
                                            <img src={img.src} alt={`Media ${idx}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                                <div className="w-full flex justify-end">
                                                    <div className="bg-white/20 hover:bg-white/30 p-1.5 rounded-lg border border-white/20 backdrop-blur-md transition-colors">
                                                        <Download className="w-4 h-4 text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Documents Section */}
                        {(fileFilter === 'all' || fileFilter === 'docs') && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-bold text-neutral-300 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" /> Shared Documents
                                    </h4>
                                </div>
                                <div className="flex flex-col gap-3">
                                    {[
                                        { name: "Lease_Agreement_SIGNED.pdf", icon: <FileText className="w-4 h-4 text-primary" />, color: "primary", size: "2.4 MB", date: "Feb 1" },
                                        { name: "Move_In_Checklist.pdf", icon: <File className="w-4 h-4 text-blue-500" />, color: "blue-500", size: "840 KB", date: "Feb 1" },
                                        { name: "Unit102_Inventory.xlsx", icon: <File className="w-4 h-4 text-emerald-500" />, color: "emerald-500", size: "1.2 MB", date: "Jan 15" },
                                        { name: "Building_Rules_2026.pdf", icon: <FileText className="w-4 h-4 text-neutral-300" />, color: "neutral-500", size: "3.5 MB", date: "Jan 10" },
                                    ].map((doc, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl border border-white/5 bg-black/20 hover:bg-white/[0.05] hover:border-white/10 cursor-pointer transition-all group">
                                            <div className={`p-2.5 bg-${doc.color.split('-')[0]}/10 rounded-xl shrink-0 border border-${doc.color.split('-')[0]}/20 group-hover:scale-105 transition-transform`}>
                                                {doc.icon}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs text-neutral-200 font-bold truncate group-hover:text-white transition-colors">{doc.name}</p>
                                                <div className="flex items-center gap-2 mt-1 blur-0">
                                                    <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider">{doc.size}</span>
                                                    <span className="w-1 h-1 rounded-full bg-white/10"></span>
                                                    <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider">{doc.date}</span>
                                                </div>
                                            </div>
                                            <div className="p-2 text-neutral-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                                <Download className="w-4 h-4" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Payment History Full Modal Overlay */}
            {showPaymentHistoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div id="payment-statement" className="w-full max-w-2xl bg-neutral-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-neutral-900/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                                    <History className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Full Payment history</h3>
                                    <p className="text-xs text-neutral-500 mt-1">{activeContact.name} • {activeContact.unit}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPaymentHistoryModal(false)}
                                className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body - Detailed List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            <div className="space-y-4">
                                {[
                                    { month: "February 2026", type: "Rent", amount: "13,000", status: "Pending Verification", date: "Feb 28, 2026", method: "GCash" },
                                    { month: "January 2026", type: "Rent", amount: "13,000", status: "Paid", date: "Jan 1, 2026", method: "GCash" },
                                    { month: "December 2025", type: "Security Deposit", amount: "26,000", status: "Paid", date: "Dec 28, 2025", method: "Bank Transfer" },
                                    { month: "December 2025", type: "Rent", amount: "13,000", status: "Paid", date: "Dec 2, 2025", method: "GCash" },
                                    { month: "November 2025", type: "Rent", amount: "13,000", status: "Paid", date: "Nov 3, 2025", method: "GCash" },
                                    { month: "October 2025", type: "Rent", amount: "13,000", status: "Paid", date: "Oct 1, 2025", method: "GCash" },
                                ].map((payment, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "p-2 rounded-xl border",
                                                payment.status === "Paid" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-primary/10 border-primary/20 text-primary"
                                            )}>
                                                <CreditCard className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{payment.month}</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">{payment.type} via {payment.method}</span>
                                                    <span className="w-1 h-1 rounded-full bg-neutral-700"></span>
                                                    <span className="text-[10px] text-neutral-500">{payment.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <span className="text-base font-black text-white">₱{payment.amount}</span>
                                            <span className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded-full mt-1",
                                                payment.status === "Paid" ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
                                            )}>
                                                {payment.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-white/5 bg-neutral-900/50 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-0.5">Total Paid (Lifetime)</span>
                                <span className="text-lg font-black text-white">₱91,000</span>
                            </div>
                            <button
                                disabled={isDownloading}
                                onClick={() => handleDownloadImage('payment-statement', 'Payment-Statement')}
                                className={cn(
                                    "bg-primary text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-primary/20",
                                    isDownloading ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"
                                )}
                            >
                                {isDownloading ? "Generating..." : "Download Statement (Image)"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
