"use client";

import { cn } from "@/lib/utils";
import { RoleBadge } from "@/components/profile/RoleBadge";
import { ContactItem as ContactItemType } from "./types";

interface ContactItemProps {
    contact: ContactItemType;
    isActive: boolean;
    onClick: () => void;
}

export function ContactItem({ contact, isActive, onClick }: ContactItemProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left group relative",
                isActive 
                    ? "bg-primary/10 border border-primary/20 shadow-sm" 
                    : "border border-transparent hover:bg-surface-2"
            )}
        >
            <div className="relative shrink-0">
                <div 
                    className="size-12 shrink-0 rounded-full border border-border overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105"
                    style={{ backgroundColor: contact.avatarBgColor || 'var(--surface-3)' }}
                >
                    {contact.avatarUrl ? (
                        <img src={contact.avatarUrl} alt={contact.name} className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-sm font-bold text-high">{contact.initials}</span>
                    )}
                </div>
                {contact.unread > 0 && (
                    <div className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border-2 border-surface-1 bg-red-500 shadow-sm animate-in zoom-in duration-300">
                        <span className="text-[10px] font-black text-white">{contact.unread}</span>
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <div className="flex min-w-0 items-center gap-2 pr-2">
                        <h4 className={cn(
                            "truncate text-sm font-bold transition-colors",
                            isActive ? "text-primary" : "text-high"
                        )}>
                            {contact.name}
                        </h4>
                        <RoleBadge role={contact.role} />
                    </div>
                    <span className="shrink-0 text-[10px] font-medium text-disabled">
                        {contact.lastContact}
                    </span>
                </div>
                <p className="truncate text-xs font-medium text-medium">
                    {contact.unit}
                </p>
            </div>
            
            {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
            )}
        </button>
    );
}

