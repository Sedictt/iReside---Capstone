"use client";

import { MessageSquare, Clock, Home, ArrowRight, Mail, MoreVertical, Eye, Archive, Trash2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface Inquiry {
    id: string;
    prospectName: string;
    prospectAvatar?: string;
    propertyName: string;
    propertyImage: string;
    messagePreview: string;
    timestamp: string;
    isUnread: boolean;
}

const MOCK_INQUIRIES: Inquiry[] = [
    {
        id: "1",
        prospectName: "Sarah Martinez",
        propertyName: "Skyline Tower Unit 402",
        propertyImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
        messagePreview: "Hi! I'm very interested in this unit. Is it still available for viewing this weekend?",
        timestamp: "5 minutes ago",
        isUnread: true
    },
    {
        id: "2",
        prospectName: "Michael Chen",
        propertyName: "Garden View Apartments B-12",
        propertyImage: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
        messagePreview: "I'd like to know more about the lease terms and if pets are allowed...",
        timestamp: "2 hours ago",
        isUnread: true
    },
    {
        id: "3",
        prospectName: "Emma Rodriguez",
        propertyName: "Downtown Loft 503",
        propertyImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop",
        messagePreview: "Is parking included? Also, what utilities are covered in the rent?",
        timestamp: "Yesterday",
        isUnread: false
    },
    {
        id: "4",
        prospectName: "James Wilson",
        propertyName: "Riverside Condos #208",
        propertyImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop",
        messagePreview: "I'm relocating for work next month. Can we schedule a virtual tour?",
        timestamp: "2 days ago",
        isUnread: false
    }
];

export function RecentInquiries() {
    console.log('RecentInquiries component rendering');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    const handleMenuOpen = (inquiryId: string) => {
        if (openMenuId === inquiryId) {
            setOpenMenuId(null);
            return;
        }
        const btn = document.getElementById(`menu-btn-${inquiryId}`);
        if (btn) {
            const rect = btn.getBoundingClientRect();
            setMenuPos({
                top: rect.bottom + 8,
                left: rect.right - 192, // 192px = w-48
            });
        }
        setOpenMenuId(inquiryId);
    };

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                const target = event.target as HTMLElement;
                if (!target.closest('[id^="menu-btn-"]')) {
                    setOpenMenuId(null);
                }
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <>
            <div className="w-full rounded-3xl bg-gradient-to-br from-[#171717] to-[#0a0a0a] border border-white/5 shadow-xl">
                {/* Header */}
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                                <MessageSquare className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Recent Inquiries</h2>
                                <p className="text-sm text-neutral-400">Respond quickly to convert more prospects</p>
                            </div>
                        </div>
                        <a
                            href="/landlord/messages"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-neutral-300 hover:text-white transition-all group"
                        >
                            <span>View All</span>
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </div>

                {/* Inquiries Grid - Compact Card Layout */}
                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {MOCK_INQUIRIES.map((inquiry, index) => (
                            <motion.div
                                key={inquiry.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.3 }}
                                className="group relative rounded-2xl bg-neutral-900 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-lime-900/20"
                            >
                                {/* Header Section with Property Image Background */}
                                <div className="relative h-32 overflow-hidden rounded-t-2xl">
                                    {/* Property Background Image */}
                                    <img
                                        src={inquiry.propertyImage}
                                        alt={inquiry.propertyName}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />

                                    {/* Gradient Overlays */}
                                    {inquiry.isUnread ? (
                                        // Green gradient overlay for unread
                                        <>
                                            <div className="absolute inset-0 bg-gradient-to-br from-lime-600/60 via-emerald-700/50 to-neutral-900/70" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent" />
                                        </>
                                    ) : (
                                        // Neutral dark overlay for read
                                        <>
                                            <div className="absolute inset-0 bg-neutral-900/50" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/60 to-transparent" />
                                        </>
                                    )}

                                    {/* Three-dot Menu Button */}
                                    <div className="absolute top-3 right-3 z-20">
                                        <button
                                            id={`menu-btn-${inquiry.id}`}
                                            className="p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 transition-all group/menu"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMenuOpen(inquiry.id);
                                            }}
                                        >
                                            <MoreVertical className="h-4 w-4 text-white group-hover/menu:scale-110 transition-transform" />
                                        </button>
                                    </div>

                                    {/* Unread Badge */}
                                    {inquiry.isUnread && (
                                        <div className="absolute top-3 right-14 flex items-center gap-1.5 bg-lime-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse z-10">
                                            <Mail className="h-3 w-3" />
                                            New
                                        </div>
                                    )}

                                    {/* Avatar positioned at bottom */}
                                    <div className="absolute bottom-3 left-4 flex items-center gap-3 z-10">
                                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30">
                                            <span className="text-lg font-bold text-white">
                                                {inquiry.prospectName.split(' ').map(n => n[0]).join('')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-4 space-y-3">
                                    {/* Name and Property */}
                                    <div>
                                        <h3 className="text-base font-bold text-white mb-1 truncate">
                                            {inquiry.prospectName}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                                            <Home className="h-3.5 w-3.5 flex-shrink-0" />
                                            <p className="truncate font-medium">{inquiry.propertyName}</p>
                                        </div>
                                    </div>

                                    {/* Message Preview */}
                                    <p className="text-sm text-neutral-400 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                                        {inquiry.messagePreview}
                                    </p>

                                    {/* Footer with Time and Action */}
                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                                            <Clock className="h-3.5 w-3.5" />
                                            <span>{inquiry.timestamp}</span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button className="w-full py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 text-sm font-bold transition-all shadow-lg hover:shadow-xl">
                                        Reply now
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Empty State (if no inquiries) */}
                {MOCK_INQUIRIES.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-800/50 mb-4">
                            <MessageSquare className="h-8 w-8 text-neutral-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">No Recent Inquiries</h3>
                        <p className="text-sm text-neutral-400 max-w-sm mx-auto">
                            When potential tenants message you about your listings, they'll appear here.
                        </p>
                    </div>
                )}
            </div>

            {/* Portal Dropdown Menu */}
            {openMenuId && createPortal(
                <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.15 }}
                    className="fixed w-48 rounded-xl bg-neutral-900 border border-white/10 shadow-2xl backdrop-blur-xl z-[9999]"
                    style={{ top: menuPos.top, left: menuPos.left }}
                >
                    <div className="py-1">
                        <button
                            onClick={() => {
                                console.log('Toggle read status');
                                setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left group/item"
                        >
                            <CheckCircle className="h-4 w-4 text-neutral-400 group-hover/item:text-white transition-colors" />
                            <span className="text-sm text-neutral-300 group-hover/item:text-white transition-colors">
                                {MOCK_INQUIRIES.find(i => i.id === openMenuId)?.isUnread ? 'Mark as Read' : 'Mark as Unread'}
                            </span>
                        </button>

                        <button
                            onClick={() => {
                                console.log('View property');
                                setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left group/item"
                        >
                            <Eye className="h-4 w-4 text-neutral-400 group-hover/item:text-white transition-colors" />
                            <span className="text-sm text-neutral-300 group-hover/item:text-white transition-colors">
                                View Property
                            </span>
                        </button>

                        <button
                            onClick={() => {
                                console.log('Archive inquiry');
                                setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left group/item"
                        >
                            <Archive className="h-4 w-4 text-neutral-400 group-hover/item:text-white transition-colors" />
                            <span className="text-sm text-neutral-300 group-hover/item:text-white transition-colors">
                                Archive
                            </span>
                        </button>

                        <div className="border-t border-white/5 my-1" />
                        <button
                            onClick={() => {
                                console.log('Delete inquiry');
                                setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-500/10 transition-colors text-left group/item"
                        >
                            <Trash2 className="h-4 w-4 text-red-400 group-hover/item:text-red-300 transition-colors" />
                            <span className="text-sm text-red-400 group-hover/item:text-red-300 transition-colors">
                                Delete
                            </span>
                        </button>
                    </div>
                </motion.div>,
                document.body
            )}
        </>
    );
}
