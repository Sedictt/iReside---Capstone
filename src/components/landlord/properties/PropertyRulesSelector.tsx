"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Plus, X, ShieldCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCustomRules } from "@/hooks/useCustomRules";
import { DEFAULT_PROPERTY_RULES } from "@/lib/constants/rules";
import { toast } from "sonner";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";

interface RuleChipProps {
    rule: string;
    isSelected: boolean;
    isDarkVariant?: boolean;
    isCustom?: boolean;
    onToggle: () => void;
    onRemove?: (e: React.MouseEvent) => void;
}

function RuleChip({
    rule,
    isSelected,
    isDarkVariant,
    isCustom = false,
    onToggle,
    onRemove,
}: RuleChipProps) {
    const textRef = useRef<HTMLSpanElement>(null);
    const [isTruncated, setIsTruncated] = useState(false);

    const checkTruncation = useCallback(() => {
        if (textRef.current) {
            const hasOverflow = textRef.current.scrollWidth > textRef.current.clientWidth + 1;
            setIsTruncated(hasOverflow);
        }
    }, []);

    useEffect(() => {
        checkTruncation();
        window.addEventListener("resize", checkTruncation);
        if (typeof document !== "undefined" && document.fonts?.ready) {
            document.fonts.ready.then(checkTruncation).catch(() => {});
        }
        return () => window.removeEventListener("resize", checkTruncation);
    }, [checkTruncation, rule]);

    const button = (
        <button
            type="button"
            onClick={onToggle}
            onMouseEnter={checkTruncation}
            aria-pressed={isSelected}
            title={isTruncated ? rule : undefined}
            className={cn(
                isCustom
                    ? "w-full px-4 py-3 pr-8 rounded-2xl text-[11px] font-black uppercase tracking-wider border transition-all text-left truncate flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                    : "w-full px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider border transition-all text-left flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer",
                isSelected
                    ? "bg-primary text-black border-primary shadow-md shadow-primary/20 font-black"
                    : isDarkVariant
                    ? "bg-white/5 border-white/5 text-white/50 hover:text-white/90 hover:border-white/20"
                    : "neumorphic-inset-card border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
            )}
        >
            {isSelected && <Check className="size-3.5 shrink-0 stroke-[3]" />}
            <span ref={textRef} className="truncate">
                {rule}
            </span>
        </button>
    );

    const wrappedButton = isTruncated ? (
        <Tooltip content={rule} side="top" sideOffset={6}>
            {button}
        </Tooltip>
    ) : (
        button
    );

    if (isCustom) {
        return (
            <div className="relative group flex items-center">
                {wrappedButton}
                {onRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        title={`Delete "${rule}" from choices`}
                        aria-label={`Delete custom rule choice ${rule}`}
                        className={cn(
                            "absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity cursor-pointer",
                            isSelected
                                ? "text-black/60 hover:text-black hover:bg-black/10"
                                : isDarkVariant
                                ? "text-white/40 hover:text-rose-400 hover:bg-white/10"
                                : "text-muted-foreground hover:text-rose-500 hover:bg-muted"
                        )}
                    >
                        <X className="size-3.5" />
                    </button>
                )}
            </div>
        );
    }

    return wrappedButton;
}

interface PropertyRulesSelectorProps {
    selectedRules: string[];
    onChange: (rules: string[]) => void;
    landlordId?: string | null;
    variant?: "default" | "dark";
    className?: string;
}

export function PropertyRulesSelector({
    selectedRules,
    onChange,
    landlordId,
    variant = "default",
    className,
}: PropertyRulesSelectorProps) {
    const isDarkVariant = variant === "dark";
    const [inputValue, setInputValue] = useState("");

    const {
        defaultRules,
        customRules,
        addCustomRule,
        removeCustomRule,
    } = useCustomRules({
        landlordId,
        initialCustomRules: selectedRules.filter(
            (r) => !DEFAULT_PROPERTY_RULES.some((d) => d.toLowerCase() === r.toLowerCase())
        ),
    });

    const toggleRule = (rule: string) => {
        const isSelected = selectedRules.some(
            (r) => r.toLowerCase() === rule.toLowerCase()
        );
        if (isSelected) {
            onChange(selectedRules.filter((r) => r.toLowerCase() !== rule.toLowerCase()));
        } else {
            onChange([...selectedRules, rule]);
        }
    };

    const handleAddCustom = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = inputValue.trim();
        if (!trimmed) return;

        const result = addCustomRule(trimmed);
        if (!result.success) {
            toast.error(result.error || "Unable to add custom rule.");
            return;
        }

        const addedName = result.name || trimmed;
        // Automatically select the newly created rule for this property
        if (!selectedRules.some((r) => r.toLowerCase() === addedName.toLowerCase())) {
            onChange([...selectedRules, addedName]);
        }

        setInputValue("");
        toast.success(`"${addedName}" added! It is now saved as a choice for all your properties.`);
    };

    const handleRemoveCustomChoice = (ruleName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        removeCustomRule(ruleName);
        // Also unselect it if currently selected
        if (selectedRules.some((r) => r.toLowerCase() === ruleName.toLowerCase())) {
            onChange(selectedRules.filter((r) => r.toLowerCase() !== ruleName.toLowerCase()));
        }
        toast.info(`"${ruleName}" removed from your custom choices.`);
    };

    return (
        <TooltipProvider delayDuration={300}>
            <div
                className={cn(
                    "rounded-[2rem] p-7 space-y-6 border transition-all",
                    isDarkVariant
                        ? "bg-white/[0.02] border-white/10"
                        : "neumorphic-panel border-border/60",
                    className
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-primary" />
                        <h3
                            className={cn(
                                "text-xs font-black uppercase tracking-[0.2em]",
                                isDarkVariant ? "text-white/60" : "text-muted-foreground"
                            )}
                        >
                            Building Rules & Conduct
                        </h3>
                    </div>
                    <span className="text-[10px] font-black text-primary px-3 py-1 bg-primary/10 rounded-full border border-primary/20 uppercase tracking-widest">
                        {selectedRules.length} Defined
                    </span>
                </div>

                {/* Standard Rules */}
                <div className="space-y-2.5">
                    <p
                        className={cn(
                            "text-[10px] font-black uppercase tracking-wider px-1",
                            isDarkVariant ? "text-white/40" : "text-muted-foreground"
                        )}
                    >
                        Standard Rules
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {defaultRules.map((rule) => (
                            <RuleChip
                                key={rule}
                                rule={rule}
                                isSelected={selectedRules.some(
                                    (r) => r.toLowerCase() === rule.toLowerCase()
                                )}
                                isDarkVariant={isDarkVariant}
                                onToggle={() => toggleRule(rule)}
                            />
                        ))}
                    </div>
                </div>

                {/* Custom Rules Section (if any have been saved) */}
                {customRules.length > 0 && (
                    <div className="space-y-2.5 pt-2 border-t border-border/40">
                        <div className="flex items-center justify-between px-1">
                            <p
                                className={cn(
                                    "text-[10px] font-black uppercase tracking-wider",
                                    isDarkVariant ? "text-white/40" : "text-muted-foreground"
                                )}
                            >
                                Your Custom Rules
                            </p>
                            <span
                                className={cn(
                                    "text-[9px] font-medium tracking-normal",
                                    isDarkVariant ? "text-white/30" : "text-muted-foreground/60"
                                )}
                            >
                                Saved for your account
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {customRules.map((rule) => (
                                <RuleChip
                                    key={rule}
                                    rule={rule}
                                    isSelected={selectedRules.some(
                                        (r) => r.toLowerCase() === rule.toLowerCase()
                                    )}
                                    isDarkVariant={isDarkVariant}
                                    isCustom
                                    onToggle={() => toggleRule(rule)}
                                    onRemove={(e) => handleRemoveCustomChoice(rule, e)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Add Custom Rule Input */}
                <div className="space-y-2 pt-2 border-t border-border/40">
                    <label
                        htmlFor="custom-rule-input"
                        className={cn(
                            "text-[10px] font-black uppercase tracking-wider px-1 block",
                            isDarkVariant ? "text-white/40" : "text-muted-foreground"
                        )}
                    >
                        Add Custom Rule
                    </label>
                    <form onSubmit={handleAddCustom} className="flex gap-2">
                        <input
                            id="custom-rule-input"
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="e.g. No Videoke Starting 10pm to 9am"
                            className={cn(
                                "flex-1 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all",
                                isDarkVariant
                                    ? "bg-white/5 border border-white/10 text-white placeholder:text-white/20"
                                    : "neumorphic-inset text-foreground placeholder:text-muted-foreground/50 border-0"
                            )}
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim()}
                            className={cn(
                                "px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50",
                                inputValue.trim()
                                    ? "bg-primary text-black hover:brightness-105 active:scale-95 shadow-sm cursor-pointer"
                                    : "opacity-40 cursor-not-allowed bg-muted text-muted-foreground border border-border/40"
                            )}
                        >
                            <Plus className="size-3.5 stroke-[3]" />
                            <span>Add Rule</span>
                        </button>
                    </form>
                    <p
                        className={cn(
                            "text-[10px] px-1",
                            isDarkVariant ? "text-white/30" : "text-muted-foreground/60"
                        )}
                    >
                        Custom rules are automatically saved to your account so you can reuse them in future properties.
                    </p>
                </div>
            </div>
        </TooltipProvider>
    );
}
