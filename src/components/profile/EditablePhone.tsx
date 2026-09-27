"use client";

import { useState } from "react";
import { Phone, Pencil, Check, X, Loader2, Plus, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type EditablePhoneProps = {
    initialPhone?: string | null;
    userId: string;
    className?: string;
};

export function EditablePhone({ initialPhone, userId, className }: EditablePhoneProps) {
    const router = useRouter();
    const [phone, setPhone] = useState(initialPhone || "");
    const [isEditing, setIsEditing] = useState(false);
    const [tempPhone, setTempPhone] = useState(initialPhone || "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePhoneChange = (val: string) => {
        // Strict real-time sanitization: keep only digits, spaces, plus, hyphens, and parens
        const sanitized = val.replace(/[^0-9+\-()\s]/g, "");
        setTempPhone(sanitized);
        if (error) setError(null);
    };

    const validatePhone = (val: string): boolean => {
        const digitsOnly = val.replace(/\D/g, "");
        if (digitsOnly.length === 0) {
            setError("Phone number is required");
            return false;
        }
        if (digitsOnly.length < 10 || digitsOnly.length > 15) {
            setError("Please enter a valid phone number (10–15 digits)");
            return false;
        }
        return true;
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (saving) return;

        if (!validatePhone(tempPhone)) {
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const supabase = createClient();
            const { error: updateError } = await supabase
                .from("profiles")
                .update({ phone: tempPhone.trim() })
                .eq("id", userId);

            if (updateError) throw updateError;

            setPhone(tempPhone.trim());
            setIsEditing(false);
            toast.success("Phone number updated successfully");
            window.dispatchEvent(new CustomEvent("profile-updated"));
            router.refresh();
        } catch (err: any) {
            console.error("Failed to update phone:", err);
            setError(err?.message || "Failed to update phone number");
            toast.error("Failed to update phone number");
        } finally {
            setSaving(false);
        }
    };

    if (isEditing) {
        return (
            <form onSubmit={handleSave} noValidate className="flex flex-col items-center gap-2 w-full max-w-xs animate-in fade-in">
                <div className="relative w-full">
                    <input
                        type="tel"
                        inputMode="tel"
                        value={tempPhone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        onBlur={() => validatePhone(tempPhone)}
                        placeholder="+63 912 345 6789"
                        autoFocus
                        className="w-full bg-background border border-border focus:border-primary rounded-xl px-3 py-1.5 text-sm text-foreground text-center focus:outline-none transition-colors neumorphic-inset"
                    />
                </div>
                {error && (
                    <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
                        <AlertCircle size={13} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg neumorphic-primary text-[10px] font-black uppercase tracking-wider transition disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        Save
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setTempPhone(phone);
                            setIsEditing(false);
                            setError(null);
                        }}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg neumorphic-extruded text-muted-foreground hover:text-foreground text-[10px] font-black uppercase tracking-wider transition"
                    >
                        <X size={12} />
                        Cancel
                    </button>
                </div>
            </form>
        );
    }

    if (!phone) {
        return (
            <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="group relative inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold text-red-500 dark:text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-all cursor-pointer shadow-sm"
                title="Add your phone number (Required for profile setup)"
            >
                <span className="relative flex size-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex rounded-full size-2 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
                </span>
                <span>Add Phone Number</span>
                <Plus size={13} className="group-hover:rotate-90 transition-transform" />
            </button>
        );
    }

    return (
        <div className="group/phone flex items-center justify-center gap-2">
            <a
                href={`tel:${phone}`}
                className="text-sm font-medium hover:text-primary transition-colors"
            >
                {phone}
            </a>
            <button
                type="button"
                onClick={() => {
                    setTempPhone(phone);
                    setIsEditing(true);
                }}
                className="opacity-0 group-hover/phone:opacity-100 size-6 rounded-md hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-all cursor-pointer"
                title="Edit phone number"
                aria-label="Edit phone number"
            >
                <Pencil size={12} />
            </button>
        </div>
    );
}
