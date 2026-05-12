"use client";

import Image from 'next/image';
import { 
    Search, 
    MoreVertical, 
    Folder, 
    AlertTriangle,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ContactItem, QuickAction } from "./types";
import { RoleBadge } from "@/components/profile/RoleBadge";

interface ChatHeaderProps {
    contact: ContactItem;
    showFilesSidebar: boolean;
    setShowFilesSidebar: (val: boolean) => void;
    showInfoSidebar: boolean;
    setShowInfoSidebar: (val: boolean) => void;
    openReportWizard: () => void;
}

export function ChatHeader({
    contact,
    showFilesSidebar,
    setShowFilesSidebar,
    showInfoSidebar,
    setShowInfoSidebar,
    openReportWizard
}: ChatHeaderProps) {
    const isPlaceholder = !contact.id;

    return (
        <div className="z-20 flex h-20 shrink-0 items-center justify-between border-b border-divider bg-surface-1/80 px-6 backdrop-blur-md">
            <div className="flex items-center gap-4">
                <div 
                    className={cn(
                        "relative size-12 rounded-full border border-border overflow-hidden flex items-center justify-center transition-all",
                        isPlaceholder ? "bg-surface-2" : ""
                    )}
                    style={{ backgroundColor: contact.avatarBgColor || 'var(--surface-3)' }}
                >
                    {contact.avatarUrl ? (
                        <Image src={contact.avatarUrl} alt={contact.name} fill sizes="48px" className="object-cover" />
                    ) : (
                        <span className="text-sm font-black text-high">{contact.initials}</span>
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-high">{contact.name}</h3>
                        {!isPlaceholder && <RoleBadge role={contact.role} />}
                    </div>
                    {!isPlaceholder && (
                        <div className="flex items-center gap-2 text-xs font-medium text-medium">
                            <span>{contact.unit}</span>
                            <span className="size-1 rounded-full bg-disabled" />
                            {contact.isOnline ? (
                                <span className="text-emerald-500 flex items-center gap-1">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Online
                                </span>
                            ) : (
                                <span className="text-disabled flex items-center gap-1">
                                    <span className="size-1.5 rounded-full bg-disabled" />
                                    Offline
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {!isPlaceholder && (
                <div className="flex items-center gap-2">
                    <button 
                        onClick={openReportWizard}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/5 text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-500/10 hover:bg-red-500/10 transition-all active:scale-95"
                    >
                        <AlertTriangle className="size-3.5" />
                        <span className="hidden sm:inline">Report</span>
                    </button>
                    
                    <div className="h-8 w-[1px] bg-divider mx-2" />
                    
                    <button
                        onClick={() => {
                            setShowFilesSidebar(!showFilesSidebar);
                            setShowInfoSidebar(false);
                        }}
                        className={cn(
                            "p-2.5 rounded-xl transition-all active:scale-95",
                            showFilesSidebar 
                                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                                : "text-medium hover:bg-surface-2"
                        )}
                        title="Shared Files"
                    >
                        <Folder className="size-5" />
                    </button>
                    
                    <button
                        onClick={() => {
                            setShowInfoSidebar(!showInfoSidebar);
                            setShowFilesSidebar(false);
                        }}
                        className={cn(
                            "p-2.5 rounded-xl transition-all active:scale-95",
                            showInfoSidebar 
                                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                                : "text-medium hover:bg-surface-2"
                        )}
                    >
                        <MoreVertical className="size-5" />
                    </button>
                </div>
            )}
        </div>
    );
}

