'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SettingsCategoryItem {
    id: string;
    label: string;
    icon: LucideIcon | React.ComponentType<{ className?: string }>;
    description?: string;
}

interface MobileSettingsCategoryDropdownProps {
    items: SettingsCategoryItem[];
    activeTab: string;
    onSelectTab: (id: string) => void;
    label?: string;
    className?: string;
}

export function MobileSettingsCategoryDropdown({
    items,
    activeTab,
    onSelectTab,
    label = "CATEGORY",
    className,
}: MobileSettingsCategoryDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const activeItem = items.find((item) => item.id === activeTab) || items[0];
    const ActiveIcon = activeItem?.icon;

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className={cn("relative w-full", isOpen ? "z-[60]" : "z-10", className)} ref={containerRef}>
            {/* Trigger Button Matching MobilePropertySelector */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "group flex w-full items-center justify-between p-2.5 sm:p-3 rounded-[1.75rem] transition-all cursor-pointer text-left focus:outline-none",
                    "border-2 border-primary/40 bg-primary/5 dark:bg-primary/10",
                    isOpen && "border-primary shadow-sm"
                )}
            >
                <div className="flex items-center gap-3 min-w-0">
                    {/* Left Icon: Rounded Squircle */}
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25 overflow-hidden">
                        {ActiveIcon && <ActiveIcon className="size-6 text-white" />}
                    </div>

                    {/* Text block */}
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                            {label}
                        </span>
                        <span className="text-[12px] font-black uppercase tracking-widest text-foreground truncate mt-0.5">
                            {activeItem?.label?.toUpperCase() || "SELECT CATEGORY"}
                        </span>
                    </div>
                </div>

                {/* Right Chevron */}
                <div className="flex size-7 items-center justify-center shrink-0 text-primary transition-transform duration-300">
                    <ChevronDown className={cn("size-5 stroke-[2.5] transition-transform duration-300", isOpen && "rotate-180")} />
                </div>
            </button>

            {/* Dropdown Menu Matching Neumorphic Panel */}
            {isOpen && (
                <div className="absolute left-0 right-0 top-full mt-2.5 z-[200] overflow-hidden rounded-[2.5rem] neumorphic-panel p-3.5 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
                    <div className="px-3 pt-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                            SETTINGS CATEGORIES
                        </p>
                    </div>

                    {/* Category Items */}
                    <div className="custom-scrollbar-premium max-h-[320px] overflow-y-auto space-y-1.5 p-1 pr-1.5">
                        {items.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                        onSelectTab(item.id);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "group flex w-full items-center gap-3 rounded-2xl p-2.5 px-3.5 transition-all text-left cursor-pointer",
                                        isActive ? "neumorphic-inset" : "neumorphic-extruded hover:scale-[1.01]"
                                    )}
                                >
                                    <div className={cn(
                                        "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                                        isActive 
                                            ? "bg-primary text-white shadow-sm" 
                                            : "neumorphic-inset-card text-muted-foreground group-hover:text-foreground"
                                    )}>
                                        <Icon className="size-4" />
                                    </div>
                                    <div className="flex flex-1 flex-col items-start overflow-hidden">
                                        <span className={cn(
                                            "text-[11px] font-black uppercase tracking-wider truncate",
                                            isActive ? "text-primary" : "text-foreground"
                                        )}>
                                            {item.label}
                                        </span>
                                        {item.description && (
                                            <span className="text-[10px] text-muted-foreground truncate max-w-[210px]">
                                                {item.description}
                                            </span>
                                        )}
                                    </div>
                                    {isActive && (
                                        <Check className="size-4 stroke-[2.5] text-primary ml-auto shrink-0" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
