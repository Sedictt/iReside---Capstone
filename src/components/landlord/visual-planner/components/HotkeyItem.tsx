import React from "react";

interface HotkeyItemProps {
    label: string;
    shortcut: string;
}

export const HotkeyItem = ({ label, shortcut }: HotkeyItemProps) => (
    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
        <span className="text-xs font-black text-white/80">{label}</span>
        <kbd className="px-2 py-1 rounded-md bg-white/10 border border-white/10 text-[10px] font-black text-primary font-mono shadow-sm">{shortcut}</kbd>
    </div>
);
