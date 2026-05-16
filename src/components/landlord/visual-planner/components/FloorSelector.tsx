'use client';

import React, { useState, useRef, useEffect } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Layers, Edit2, Check } from 'lucide-react';
import { FloorId } from '../types';

interface FloorTab {
    id: FloorId;
    title: string;
    floorNumber: number | null;
}

interface FloorSelectorProps {
    floorTabs: FloorTab[];
    activeFloor: FloorId;
    onSelect: (floorId: FloorId) => void;
    onCreate: () => void;
    onRename: () => void;
    isDark: boolean;
    readOnly?: boolean;
    itemCount: number;
}

export const FloorSelector: React.FC<FloorSelectorProps> = ({
    floorTabs,
    activeFloor,
    onSelect,
    onCreate,
    onRename,
    isDark,
    readOnly = false,
    itemCount
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const activeTab = floorTabs.find(t => t.id === activeFloor);

    return (
        <div className="flex items-center gap-1.5 z-50" ref={dropdownRef}>
            {/* Custom Dropdown Trigger */}
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                        flex items-center justify-between gap-3 px-3 py-2 rounded-xl border transition-all duration-300 w-[160px] md:w-[200px]
                        ${isDark 
                            ? 'bg-zinc-900/80 border-white/10 hover:bg-zinc-800/80 hover:border-white/20' 
                            : 'bg-white/80 border-zinc-200 hover:bg-white hover:border-zinc-300'}
                        ${isOpen ? 'ring-2 ring-primary/20 border-primary/50' : ''}
                    `}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className={`
                            flex size-6 shrink-0 items-center justify-center rounded-lg
                            ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}
                        `}>
                            <Layers className={`size-3.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`} />
                        </div>
                        <span className={`text-xs font-black truncate text-left uppercase tracking-wider ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                            {activeTab?.title || 'Unknown'}
                        </span>
                    </div>
                    <ChevronDown className={`size-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 4, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className={`
                                absolute top-full left-0 z-[100] w-full min-w-[200px] p-1.5 rounded-2xl border backdrop-blur-2xl shadow-2xl
                                ${isDark 
                                    ? 'bg-zinc-900/95 border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)]' 
                                    : 'bg-white/95 border-zinc-200 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)]'}
                            `}
                        >
                            <div className="max-h-[300px] overflow-y-auto scrollbar-hide py-1">
                                {floorTabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            onSelect(tab.id);
                                            setIsOpen(false);
                                        }}
                                        className={`
                                            flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 group
                                            ${tab.id === activeFloor
                                                ? (isDark ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary')
                                                : (isDark ? 'text-zinc-400 hover:bg-white/5 hover:text-white' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900')}
                                        `}
                                    >
                                        <span>{tab.title}</span>
                                        {tab.id === activeFloor && (
                                            <div className="size-1.5 rounded-full bg-primary" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Quick Actions & Meta (Keep inline to maintain layout) */}
            <div className={`
                flex items-center gap-1 pl-1 border-l h-9
                ${isDark ? 'border-white/10' : 'border-zinc-200'}
            `}>
                {!readOnly && (
                    <button
                        onClick={onRename}
                        className={`
                            flex size-8 items-center justify-center rounded-xl transition-all
                            ${isDark ? 'hover:bg-white/10 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'}
                        `}
                        title="Rename Level"
                    >
                        <Edit2 className="size-3.5" />
                    </button>
                )}

                <div className={`
                    flex items-center gap-2 px-3 py-1 rounded-xl border h-8
                    ${isDark ? 'bg-zinc-800/50 border-white/5' : 'bg-zinc-50 border-zinc-100'}
                `}>
                    <div className="size-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                    <span className={`font-mono text-[11px] font-black ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                        {itemCount}
                    </span>
                </div>

                {!readOnly && (
                    <button
                        onClick={onCreate}
                        className={`
                            flex size-8 items-center justify-center rounded-xl transition-all
                            ${isDark ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20' : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'}
                        `}
                        title="Add New Level"
                    >
                        <Plus className="size-4" />
                    </button>
                )}
            </div>
        </div>
    );
};
