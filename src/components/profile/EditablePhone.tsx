"use client";

import { useState } from "react";
import { Phone, Pencil, Check, X, Loader2, Plus, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { phoneRule } from "@/lib/validation/rules";
import { useLanguageContext } from "@/context/LanguageContext";
import { tr } from "@/hooks/useLanguage";
import { PhoneNumberInput } from "@/components/ui/PhoneNumberInput";
import { formatPhMobile, toPhMobileE164 } from "@/lib/phone";

type EditablePhoneProps = {
    initialPhone?: string | null;
    userId: string;
    className?: string;
};

export function EditablePhone({ initialPhone, userId, className }: EditablePhoneProps) {
    const router = useRouter();
    const { t } = useLanguageContext();
    const [phone, setPhone] = useState(initialPhone || "");
    const [isEditing, setIsEditing] = useState(false);
    const [tempPhone, setTempPhone] = useState(initialPhone || "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePhoneChange = (val: string) => {
        setTempPhone(val);
        if (error) setError(null);
    };

    // Same phone rule as the settings forms and profile APIs (PH mobile aware).
    const validatePhone = (val: string): boolean => {
        const message = phoneRule(val, { required: true });
        setError(message ? tr(message) : null);
        return !message;
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
            const saved = toPhMobileE164(tempPhone) ?? tempPhone.trim();
            const { error: updateError } = await supabase
                .from("profiles")
                .update({ phone: saved })
                .eq("id", userId);

            if (updateError) throw updateError;

            setPhone(saved);
            setIsEditing(false);
            toast.success(t("Phone number updated successfully"));
            window.dispatchEvent(new CustomEvent("profile-updated"));
            router.refresh();
        } catch (err: any) {
            console.error("Failed to update phone:", err);
            setError(tr(err?.message || "Failed to update phone number"));
            toast.error(t("Failed to update phone number"));
        } finally {
            setSaving(false);
        }
    };

    if (isEditing) {
        return (
            <form onSubmit={handleSave} noValidate className="flex flex-col items-center gap-2 w-full max-w-xs animate-in fade-in">
                <div className="relative w-full">
                    <PhoneNumberInput
                        aria-label={t("Phone number")}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? `phone-error-${userId}` : undefined}
                        value={tempPhone}
                        onValueChange={handlePhoneChange}
                        onBlur={() => validatePhone(tempPhone)}
                        autoFocus
                        className="w-full bg-background border-2 border-foreground/25 focus:border-foreground/60 rounded-xl px-3 py-2 text-base text-foreground focus:outline-none transition-colors"
                    />
                </div>
                {error && (
                    <div id={`phone-error-${userId}`} role="alert" className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
                        <AlertCircle size={13} className="shrink-0" />
                        <span>{t(error)}</span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg neumorphic-primary text-[10px] font-black uppercase tracking-wider transition disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        {t("Save")}
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
                        {t("Cancel")}
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
                title={t("Add your phone number (Required for profile setup)")}
            >
                <span className="relative flex size-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex rounded-full size-2 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
                </span>
                <span>{t("Add Phone Number")}</span>
                <Plus size={13} className="group-hover:rotate-90 transition-transform" />
            </button>
        );
    }

    return (
        <div className="group/phone flex items-center justify-center gap-2">
            <a
                href={`tel:${toPhMobileE164(phone) ?? phone}`}
                className="text-sm font-medium hover:text-primary transition-colors"
            >
                {formatPhMobile(phone)}
            </a>
            <button
                type="button"
                onClick={() => {
                    setTempPhone(phone);
                    setIsEditing(true);
                }}
                className="opacity-0 group-hover/phone:opacity-100 size-6 rounded-md hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-all cursor-pointer"
                title={t("Edit phone number")}
                aria-label={t("Edit phone number")}
            >
                <Pencil size={12} />
            </button>
        </div>
    );
}
