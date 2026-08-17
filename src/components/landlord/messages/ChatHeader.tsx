"use client";

import Image from 'next/image';
import { 
    Search, 
    MoreVertical, 
    Folder, 
    AlertTriangle,
    ChevronRight,
    ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ContactItem, QuickAction } from "./types";
import { RoleBadge } from "@/components/profile/RoleBadge";
import { Skeleton } from "@/components/ui/Skeleton";

interface ChatHeaderProps {
    contact: ContactItem;
    isLoading?: boolean;
    showFilesSidebar: boolean;
    setShowFilesSidebar: (val: boolean) => void;
    showInfoSidebar: boolean;
    setShowInfoSidebar: (val: boolean) => void;
    openReportWizard: () => void;
    onBack?: () => void;
}

export function ChatHeader({
    contact,
    isLoading = false,
    showFilesSidebar,
    setShowFilesSidebar,
    showInfoSidebar,
    setShowInfoSidebar,
    openReportWizard,
    onBack
}: ChatHeaderProps) {
    if (isLoading) {
        return (
            <div className="z-20 flex h-20 shrink-0 items-center justify-between px-6 pt-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <div className="sm:hidden">
                            <Skeleton className="size-8 rounded-xl opacity-60" />
                        </div>
                    )}
                    <Skeleton className="size-12 rounded-full opacity-70 shrink-0" />
                    <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32 rounded-md opacity-80" />
                        <Skeleton className="h-3 w-20 rounded-md opacity-50" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-16 rounded-xl opacity-40" />
                    <div className="h-8 w-[1px] bg-divider mx-2 opacity-30" />
                    <Skeleton className="size-8 rounded-xl opacity-40" />
                    <Skeleton className="size-8 rounded-xl opacity-40" />
                </div>
            </div>
        );
    }

    const isPlaceholder = !contact.id;

    return (
        <div className="z-20 flex h-20 shrink-0 items-center justify-between px-6 pt-2">
            <div className="flex items-center gap-4">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="flex sm:hidden items-center justify-center p-2 rounded-xl neumorphic-extruded transition-all active:scale-95"
                        title="Back to List"
                    >
                        <ArrowLeft className="size-4" />
                    </button>
                )}
                <div 
                    className={cn(
                        "relative size-12 rounded-full neumorphic-inset-card overflow-hidden flex items-center justify-center transition-all",
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
                                ? "neumorphic-primary text-white" 
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
                                ? "neumorphic-primary text-white" 
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

