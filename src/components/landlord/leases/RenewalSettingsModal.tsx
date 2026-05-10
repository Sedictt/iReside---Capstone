"use client";

import { useState, useEffect } from "react";
import { X, Save, Plus, Trash2, Settings2, Info } from "lucide-react";
import { toast } from "sonner";

interface RenewalSettings {
    base_rent_adjustment: number;
    adjustment_type: "percentage" | "fixed";
    new_rules: string[];
    landlord_memo: string;
    is_enabled: boolean;
}

interface RenewalSettingsModalProps {
    propertyId: string;
    propertyName: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function RenewalSettingsModal({ propertyId, propertyName, isOpen, onClose }: RenewalSettingsModalProps) {
    const [settings, setSettings] = useState<RenewalSettings>({
        base_rent_adjustment: 0,
        adjustment_type: "percentage",
        new_rules: [],
        landlord_memo: "",
        is_enabled: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newRule, setNewRule] = useState("");

    useEffect(() => {
        if (isOpen && propertyId && propertyId !== "all") {
            fetchSettings();
        }
    }, [isOpen, propertyId]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/landlord/properties/${propertyId}/renewal-settings`);
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (error) {
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/landlord/properties/${propertyId}/renewal-settings`, {
                method: "PATCH",
                body: JSON.stringify({ settings }),
                headers: { "Content-Type": "application/json" }
            });
            if (res.ok) {
                toast.success("Renewal policy updated", {
                    description: "Tenants will see these terms before requesting a renewal."
                });
                onClose();
            } else {
                toast.error("Failed to update settings");
            }
        } catch (error) {
            toast.error("An error occurred while saving");
        } finally {
            setSaving(false);
        }
    };

    const addRule = () => {
        if (!newRule.trim()) return;
        setSettings(prev => ({ ...prev, new_rules: [...prev.new_rules, newRule.trim()] }));
        setNewRule("");
    };

    const removeRule = (idx: number) => {
        setSettings(prev => ({ ...prev, new_rules: prev.new_rules.filter((_, i) => i !== idx) }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
            <div className="relative w-full max-w-2xl bg-card rounded-[2.5rem] overflow-hidden border border-border shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-8 border-b border-border flex justify-between items-center bg-primary/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                            <Settings2 className="size-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-foreground tracking-tight">Renewal Policy</h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                                Configure terms for {propertyName}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 rounded-xl hover:bg-muted transition-colors">
                        <X className="size-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="p-20 text-center">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Syncing Configuration...</p>
                    </div>
                ) : (
                    <div className="p-8 overflow-y-auto space-y-8">
                        {/* Disclosure Notice */}
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-4 items-start">
                            <Info className="size-5 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 leading-relaxed">
                                <strong>Transparency Rule:</strong> These settings will be shown to tenants 90 days before their lease ends. They must acknowledge these terms before submitting a renewal request.
                            </p>
                        </div>

                        {/* Rent Adjustment Section */}
                        <section className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border pb-2">Rent Adjustment</h4>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Adjustment Type</label>
                                    <select 
                                        value={settings.adjustment_type}
                                        onChange={(e) => setSettings(prev => ({ ...prev, adjustment_type: e.target.value as any }))}
                                        className="w-full p-4 rounded-2xl border border-border bg-background text-sm font-black focus:ring-2 focus:ring-primary/20 outline-none"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (PHP)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        {settings.adjustment_type === "percentage" ? "Increase (%)" : "Increase (PHP)"}
                                    </label>
                                    <input 
                                        type="number"
                                        value={settings.base_rent_adjustment}
                                        onChange={(e) => setSettings(prev => ({ ...prev, base_rent_adjustment: parseFloat(e.target.value) || 0 }))}
                                        className="w-full p-4 rounded-2xl border border-border bg-background text-sm font-black focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* New Rules Section */}
                        <section className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border pb-2">Updated Rules & Clauses</h4>
                            <div className="space-y-3">
                                {settings.new_rules.map((rule, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-muted/30 p-3 rounded-xl border border-border/50">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        <span className="flex-1 text-sm font-medium">{rule}</span>
                                        <button onClick={() => removeRule(idx)} className="text-muted-foreground hover:text-red-500 transition-colors">
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                ))}
                                <div className="flex gap-2">
                                    <input 
                                        type="text"
                                        placeholder="Add a new rule or term change..."
                                        value={newRule}
                                        onChange={(e) => setNewRule(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addRule()}
                                        className="flex-1 p-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                    <button 
                                        onClick={addRule}
                                        className="p-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                                    >
                                        <Plus className="size-5" />
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Landlord Memo */}
                        <section className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border pb-2">Landlord's Note to Residents</h4>
                            <textarea 
                                value={settings.landlord_memo}
                                onChange={(e) => setSettings(prev => ({ ...prev, landlord_memo: e.target.value }))}
                                placeholder="Explain the changes or provide extra context for renewals..."
                                className="w-full p-4 rounded-2xl border border-border bg-background text-sm min-h-[120px] outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                            />
                        </section>
                    </div>
                )}

                {/* Footer */}
                <div className="p-6 border-t border-border bg-muted/20 flex gap-4">
                    <button onClick={onClose} className="flex-1 px-6 py-4 rounded-2xl border border-border text-muted-foreground hover:bg-muted font-black uppercase tracking-widest text-xs transition-all">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="flex-[2] px-6 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        {saving ? "Saving Policy..." : "Update Renewal Policy"}
                        <Save className="size-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

