"use client";

import { useEffect, useState } from "react";
import { X, ArrowRight, ArrowLeft, CheckCircle2, Check, FileText, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UtilitySplitMethod } from "@/types/database";

export type SmartContractClause = {
    id: number;
    title: string;
    description: string;
};

export type SmartContractTemplate = {
    answers: Record<string, string | string[]>;
    customClauses: SmartContractClause[];
};

type SupportedPropertyEnum = "apartment" | "dormitory" | "boarding_house";

interface SmartContractBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (template: SmartContractTemplate) => void;
    initialTemplate?: SmartContractTemplate | null;
    propertyType?: SupportedPropertyEnum;
    utilitySplitMethod?: UtilitySplitMethod;
    fixedChargeAmount?: number;
}

// ── Contract title per property type ────────────────────────
const CONTRACT_TITLE: Record<SupportedPropertyEnum, string> = {
    dormitory: "Dormitory Student Agreement",
    boarding_house: "Boarding House Residence Policy",
    apartment: "Residential Lease Agreement",
};

// ── Utility clause text per type/split ──────────────────────
function buildUtilityClause(
    propertyType: SupportedPropertyEnum,
    splitMethod: UtilitySplitMethod,
    fixedAmount?: number
): string {
    if (propertyType === "dormitory") {
        return "Utility charges (water and electricity) are shared equally among all bedspace occupants based on head count for the billing period.";
    }
    if (propertyType === "boarding_house") {
        if (splitMethod === "equal_per_head") {
            return "Utility charges are divided equally among all occupants in the boarding house based on total head count for the billing period.";
        }
        if (splitMethod === "fixed_charge") {
            const amount = fixedAmount ?? 500;
            return `Each occupant is charged a fixed monthly utility fee of ₱${amount.toLocaleString()} to cover shared water and electricity costs.`;
        }
        // individual_meter
        return "Each room is equipped with individual meters. Tenants are responsible for paying their own metered utility consumption directly.";
    }
    // apartment
    return "Utilities (water and electricity) are individually metered per unit. Each tenant is solely responsible for their own consumption and related charges.";
}

const BASE_QUESTIONS = [
    {
        id: "duration",
        title: "How long is the standard lease duration?",
        subtitle: "Most landlords opt for a 1-year layout to ensure stable occupancy.",
        type: "single-choice",
        options: ["Month-to-Month", "6 Months", "1 Year", "2 Years"],
    },
    {
        id: "rent",
        title: "How much is the monthly rent?",
        subtitle: "Enter the base rent amount, excluding any variable utility charges.",
        type: "currency",
        placeholder: "15,000",
    },
    {
        id: "deposit",
        title: "What is the required security deposit?",
        subtitle: "Usually equivalent to 1 or 2 months of rent.",
        type: "currency",
        placeholder: "30,000",
    },
    {
        id: "hard_occupancy_limit",
        title: "What is the hard occupancy limit for this property?",
        subtitle: "This is the maximum number of occupants permitted per unit at any time. It is enforced at lease and application approval.",
        type: "number",
        placeholder: "4",
    },
    {
        id: "utilities",
        title: "Which utilities are included in the rent?",
        subtitle: "Select any utilities that you, as the landlord, will cover.",
        type: "multi-choice",
        options: ["Water", "Electricity", "Internet", "Trash Collection", "HOA Fees"],
    },
    {
        id: "pets",
        title: "What is your policy on pets?",
        subtitle: "Decide whether tenants are allowed to keep animals on the property.",
        type: "single-choice",
        options: ["Pets Allowed", "No Pets Allowed", "Cats/Small Dogs Only"],
    },
    {
        id: "smoking",
        title: "Is smoking permitted?",
        subtitle: "Applies to inside the unit and any attached balconies.",
        type: "single-choice",
        options: ["Strictly No Smoking", "Smoking Allowed"],
    },
    {
        id: "custom",
        title: "Any additional custom clauses?",
        subtitle: "Add any specific rules, provisions, or terms not covered earlier.",
        type: "dynamic-list",
    },
    {
        id: "preview",
        title: "Your Contract is Ready",
        subtitle: "Review the drafted terms and specific clauses below before finalizing.",
        type: "preview",
    },
];

const DEFAULT_CUSTOM_CLAUSES: SmartContractClause[] = [{ id: 1, title: "", description: "" }];

export function SmartContractBuilderModal({
    isOpen,
    onClose,
    onSave,
    initialTemplate,
    propertyType = "apartment",
    utilitySplitMethod = "individual_meter",
    fixedChargeAmount,
}: SmartContractBuilderModalProps) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
    const [customClauses, setCustomClauses] = useState<SmartContractClause[]>(DEFAULT_CUSTOM_CLAUSES);
    const [isGenerating, setIsGenerating] = useState(false);

    const QUESTIONS = BASE_QUESTIONS;

    useEffect(() => {
        if (!isOpen) return;

        setCurrentQuestion(0);
        // Seed occupancy limit from prop if not already persisted
        const baseAnswers = initialTemplate?.answers ?? {};
        if (!baseAnswers.hard_occupancy_limit) {
            const defaultOcc = propertyType === "dormitory" ? "4" : propertyType === "boarding_house" ? "2" : "5";
            baseAnswers.hard_occupancy_limit = defaultOcc;
        }
        // Seed utility_split_method
        if (!baseAnswers.utility_split_method) {
            baseAnswers.utility_split_method = utilitySplitMethod;
        }
        if (!baseAnswers.utility_fixed_charge_amount && fixedChargeAmount) {
            baseAnswers.utility_fixed_charge_amount = String(fixedChargeAmount);
        }

        setAnswers({ ...baseAnswers });
        const seededClauses = initialTemplate?.customClauses?.length
            ? initialTemplate.customClauses
            : DEFAULT_CUSTOM_CLAUSES;
        setCustomClauses(
            seededClauses.map((clause, index) => ({
                id: Number.isFinite(clause.id) ? clause.id : Date.now() + index,
                title: clause.title ?? "",
                description: clause.description ?? "",
            }))
        );
    }, [isOpen, initialTemplate, propertyType, utilitySplitMethod, fixedChargeAmount]);

    if (!isOpen) return null;

    const q = QUESTIONS[currentQuestion];
    const isLastQuestion = currentQuestion === QUESTIONS.length - 1;

    const handleNext = () => {
        if (!isLastQuestion) {
            setCurrentQuestion(prev => prev + 1);
        } else {
            handleSave();
        }
    };

    // Auto-advance helper (used by single-choice after selection)
    const handleNextImmediate = () => {
        const next = currentQuestion + 1;
        if (next < QUESTIONS.length) {
            setCurrentQuestion(next);
        } else {
            handleSave();
        }
    };

    const handleBack = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(prev => prev - 1);
        }
    };

    const handleSave = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            const nonEmptyClauses = customClauses.filter(
                (clause) => clause.title.trim().length > 0 || clause.description.trim().length > 0
            );
            // Persist utility split keys into answers
            const finalAnswers = {
                ...answers,
                utility_split_method: utilitySplitMethod,
                ...(utilitySplitMethod === "fixed_charge" && fixedChargeAmount
                    ? { utility_fixed_charge_amount: String(fixedChargeAmount) }
                    : {}),
            };
            onSave({
                answers: finalAnswers,
                customClauses: nonEmptyClauses,
            });
            onClose();
            setTimeout(() => {
                setCurrentQuestion(0);
                setAnswers({});
                setCustomClauses(DEFAULT_CUSTOM_CLAUSES);
            }, 500);
        }, 3000);
    };

    const updateAnswer = (val: string | string[]) => {
        setAnswers(prev => ({ ...prev, [q.id]: val }));
    };

    const toggleMultiAnswer = (option: string) => {
        const existingAnswer = answers[q.id] as unknown;
        const current = Array.isArray(existingAnswer) ? (existingAnswer as string[]) : [];
        if (current.includes(option)) {
            updateAnswer(current.filter((item: string) => item !== option));
        } else {
            updateAnswer([...current, option]);
        }
    };

    const handleSingleChoice = (option: string) => {
        updateAnswer(option);
    };

    const addCustomClause = () => {
        setCustomClauses(prev => [...prev, { id: Date.now(), title: "", description: "" }]);
    };

    const updateCustomClause = (id: number, field: "title" | "description", value: string) => {
        setCustomClauses(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
        updateAnswer("custom");
    };

    const removeCustomClause = (id: number) => {
        setCustomClauses(prev => prev.filter(c => c.id !== id));
        updateAnswer("custom");
    };

    const currentAnswer = answers[q.id];

    const canProceed = () => {
        if (q.type === "single-choice") return !!currentAnswer;
        if (q.type === "currency") return !!currentAnswer && currentAnswer.toString().length > 0;
        if (q.type === "number") return !!currentAnswer && currentAnswer.toString().length > 0;
        if (q.type === "multi-choice") return true;
        if (q.type === "dynamic-list") return true;
        if (q.type === "preview") return true;
        return false;
    };

    const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;
    const contractTitle = CONTRACT_TITLE[propertyType];
    const utilityClasuseText = buildUtilityClause(propertyType, utilitySplitMethod, fixedChargeAmount);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" />

            {/* Modal */}
            <div className={cn(
                "relative w-full bg-[#0a0a0a] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200",
                "max-h-[90vh] sm:max-h-[85vh]",
                q.type === "preview" ? "max-w-4xl" : "max-w-2xl min-h-[500px]"
            )}>

                {/* Header & Progress Bar */}
                <div className="relative shrink-0">
                    <div className="h-1.5 w-full bg-white/5 absolute top-0 left-0 z-10">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between items-center p-6 pt-8">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            <span className="text-sm font-bold text-neutral-400 uppercase tracking-widest">
                                Smart Builder • {currentQuestion + 1} / {QUESTIONS.length}
                            </span>
                        </div>
                        {/* Property type badge */}
                        <div className="flex items-center gap-3">
                            <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-primary/30 text-primary/80 bg-primary/5">
                                {propertyType.replace("_", " ")}
                            </span>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Question Area - Scrollable for Preview/Lists */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 sm:p-12 pb-0 flex flex-col relative z-0">
                    {isGenerating ? (
                        <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in duration-500 pb-12">
                            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 relative">
                                <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                <CheckCircle2 className="w-10 h-10 text-primary" />
                            </div>
                            <h2 className="text-3xl font-black text-white mb-2">Finalizing Contract</h2>
                            <p className="text-neutral-400">Locking in your parameters...</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col w-full h-full pb-10">
                            <div key={q.id} className="flex-1 flex flex-col animate-in fade-in duration-500">
                                <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-3">
                                    {q.title}
                                </h2>
                                <p className="text-lg text-neutral-400 mb-10">
                                    {q.subtitle}
                                </p>

                                {/* Input Renderers */}
                                {q.type !== "dynamic-list" && q.type !== "preview" && (
                                    <div className="flex-1 w-full max-w-lg">
                                        {/* Single Choice — auto-advances after selection */}
                                        {q.type === "single-choice" && (
                                            <div className="space-y-3">
                                                {q.options?.map((opt) => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => {
                                                            handleSingleChoice(opt);
                                                            // Auto-advance after brief delay so selection pulse is visible
                                                            setTimeout(() => handleNextImmediate(), 280);
                                                        }}
                                                        className={cn(
                                                            "w-full text-left px-6 py-5 rounded-2xl border-2 transition-all font-semibold text-lg flex items-center justify-between group",
                                                            currentAnswer === opt
                                                                ? "bg-primary/10 border-primary text-white"
                                                                : "bg-white/[0.02] border-white/5 text-neutral-300 hover:border-white/20 hover:bg-white/[0.05]"
                                                        )}
                                                    >
                                                        {opt}
                                                        <div className={cn(
                                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ml-4",
                                                            currentAnswer === opt ? "border-primary bg-primary" : "border-white/20 group-hover:border-white/40 bg-transparent"
                                                        )}>
                                                            {currentAnswer === opt && <Check className="w-4 h-4 text-black" />}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Multi Choice */}
                                        {q.type === "multi-choice" && (
                                            <div className="space-y-3">
                                                {q.options?.map((opt) => {
                                                    const selectedAnswers = Array.isArray(currentAnswer) ? currentAnswer : [];
                                                    const isSelected = selectedAnswers.includes(opt);
                                                    return (
                                                        <button
                                                            key={opt}
                                                            onClick={() => toggleMultiAnswer(opt)}
                                                            className={cn(
                                                                "w-full text-left px-6 py-5 rounded-2xl border-2 transition-all font-semibold text-lg flex items-center justify-between group",
                                                                isSelected
                                                                    ? "bg-primary/10 border-primary text-white"
                                                                    : "bg-white/[0.02] border-white/5 text-neutral-300 hover:border-white/20 hover:bg-white/[0.05]"
                                                            )}
                                                        >
                                                            {opt}
                                                            <div className={cn(
                                                                "w-6 h-6 rounded border-2 flex items-center justify-center transition-colors shrink-0 ml-4",
                                                                isSelected ? "border-primary bg-primary" : "border-white/20 group-hover:border-white/40 bg-transparent"
                                                            )}>
                                                                {isSelected && <Check className="w-4 h-4 text-black" />}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Currency */}
                                        {q.type === "currency" && (
                                            <div className="relative mt-4">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-bold text-neutral-500">₱</span>
                                                <input
                                                    type="number"
                                                    autoFocus
                                                    value={currentAnswer || ""}
                                                    onChange={(e) => updateAnswer(e.target.value)}
                                                    onKeyDown={(e) => e.key === "Enter" && canProceed() && handleNext()}
                                                    placeholder={q.placeholder}
                                                    className="w-full bg-[#111] border-2 border-white/10 rounded-2xl pl-16 pr-6 py-6 text-3xl font-bold text-white focus:outline-none focus:border-primary transition-all placeholder:text-white/10 shadow-inner"
                                                />
                                            </div>
                                        )}

                                        {/* Number (occupancy limit) */}
                                        {q.type === "number" && (
                                            <div className="relative mt-4">
                                                <input
                                                    type="number"
                                                    autoFocus
                                                    min="1"
                                                    value={currentAnswer || ""}
                                                    onChange={(e) => updateAnswer(e.target.value)}
                                                    onKeyDown={(e) => e.key === "Enter" && canProceed() && handleNext()}
                                                    placeholder={q.placeholder}
                                                    className="w-full bg-[#111] border-2 border-white/10 rounded-2xl px-6 py-6 text-3xl font-bold text-white focus:outline-none focus:border-primary transition-all placeholder:text-white/10 shadow-inner"
                                                />
                                                <p className="mt-3 text-sm text-neutral-500">
                                                    {propertyType === "dormitory" ? "Bedspace slots recommended: 4–8 per unit." :
                                                     propertyType === "boarding_house" ? "Typical head limit: 2–4 per room." :
                                                     "Standard household capacity: 1–6 people."}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Dynamic List Custom Clause */}
                                {q.type === "dynamic-list" && (
                                    <div className="flex-1 w-full max-w-lg">
                                        <div className="space-y-6">
                                            {customClauses.map((clause) => (
                                                <div key={clause.id} className="p-6 bg-[#111] border border-white/10 rounded-2xl space-y-4 relative group">
                                                    {customClauses.length > 1 && (
                                                        <button
                                                            onClick={() => removeCustomClause(clause.id)}
                                                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Clause Title</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Unpaid Bills Policy"
                                                            value={clause.title}
                                                            onChange={(e) => updateCustomClause(clause.id, "title", e.target.value)}
                                                            className="w-full bg-transparent border-b border-white/10 px-0 py-2 text-white focus:outline-none focus:border-primary transition-all text-lg font-bold placeholder:text-white/20"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Clause Terms</label>
                                                        <textarea
                                                            rows={3}
                                                            placeholder="State the terms regarding this clause..."
                                                            value={clause.description}
                                                            onChange={(e) => updateCustomClause(clause.id, "description", e.target.value)}
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition-all text-sm resize-none"
                                                        />
                                                    </div>
                                                </div>
                                            ))}

                                            <button
                                                onClick={addCustomClause}
                                                className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-neutral-400 font-bold flex items-center justify-center gap-2 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all group"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20">
                                                    <Plus className="w-4 h-4" />
                                                </div>
                                                Add Another Clause
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Preview Contract Document */}
                                {q.type === "preview" && (
                                    <div className="flex-1 w-full max-w-3xl mx-auto">
                                        <div className="w-full bg-[#fdfdfd] rounded-sm text-black p-8 sm:p-12 font-serif min-h-[700px] shadow-[0_0_80px_rgba(255,255,255,0.06)] relative cursor-text">
                                            {/* Watermark */}
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] overflow-hidden">
                                                <h1 className="text-[10rem] font-black rotate-[-45deg] select-none text-black">DRAFT</h1>
                                            </div>

                                            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                                                <div className="text-center space-y-2 border-b-2 border-neutral-300 pb-8 mb-8">
                                                    <h1 className="text-2xl font-bold uppercase tracking-widest">{contractTitle}</h1>
                                                    <p className="text-neutral-500 italic text-sm">This legally binding document confirms the parameters set between Landlord &amp; Tenant.</p>
                                                </div>

                                                <div className="space-y-8 text-[15px] leading-relaxed text-neutral-800">
                                                    <div className="space-y-4">
                                                        <p>
                                                            <strong className="text-black">1. LEASE TERM:</strong> The duration of this lease is <span className="bg-primary/20 text-black px-1.5 py-0.5 rounded font-bold uppercase">{answers["duration"] || "Not Specified"}</span>. The tenant agrees to rent the premises for this agreed upon period.
                                                        </p>

                                                        <p>
                                                            <strong className="text-black">2. RENT &amp; DEPOSIT:</strong> The tenant agrees to pay a monthly base rent of <strong>₱<span className="bg-primary/20 text-black px-1.5 py-0.5 rounded font-bold uppercase">{answers["rent"] || "_____"}</span></strong>. A security deposit of <strong>₱<span className="bg-primary/20 text-black px-1.5 py-0.5 rounded font-bold uppercase">{answers["deposit"] || "_____"}</span></strong> is required prior to move-in.
                                                        </p>

                                                        <p>
                                                            <strong className="text-black">3. OCCUPANCY LIMIT:</strong> This property enforces a hard occupancy limit of <span className="bg-primary/20 text-black px-1.5 py-0.5 rounded font-bold">{answers["hard_occupancy_limit"] || "_____"}</span> person(s) per unit. Exceeding this limit is a material breach of this agreement.
                                                        </p>

                                                        <p>
                                                            <strong className="text-black">4. UTILITIES:</strong> {utilityClasuseText} The landlord additionally covers: <span className="bg-primary/20 text-black px-1.5 py-0.5 rounded font-bold uppercase">{Array.isArray(answers["utilities"]) && answers["utilities"].length > 0 ? answers["utilities"].join(", ") : "None Included"}</span>.
                                                        </p>

                                                        <p>
                                                            <strong className="text-black">5. PROPERTY POLICIES:</strong> The premises adheres to the following pet policy: <span className="bg-primary/20 text-black px-1.5 py-0.5 rounded font-bold uppercase">{answers["pets"] || "Not Specified"}</span>. Furthermore, it is strictly understood that: <span className="bg-primary/20 text-black px-1.5 py-0.5 rounded font-bold uppercase">{answers["smoking"] || "Not Specified"}</span> within or strictly on the premises.
                                                        </p>
                                                    </div>

                                                    {/* Inject Custom Clauses here */}
                                                    {customClauses.filter(c => c.title && c.description).length > 0 && (
                                                        <div className="pt-6 mt-6 border-t border-neutral-200 space-y-4">
                                                            <h3 className="font-bold text-black uppercase tracking-wider text-sm mb-4">Additional Clauses</h3>
                                                            {customClauses.filter(c => c.title && c.description).map((clause, idx) => (
                                                                <p key={idx}>
                                                                    <strong className="text-black uppercase">{(idx + 6)}. {clause.title}:</strong> {clause.description}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="pt-20 border-t border-neutral-200 grid grid-cols-2 gap-12 text-sm mt-20">
                                                        <div>
                                                            <div className="border-b border-black pb-1 mb-2"></div>
                                                            <p className="font-bold uppercase tracking-wider text-neutral-500">Landlord Signature</p>
                                                        </div>
                                                        <div>
                                                            <div className="border-b border-black pb-1 mb-2"></div>
                                                            <p className="font-bold uppercase tracking-wider text-neutral-500">Tenant Signature</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls strictly anchored to bottom */}
                {!isGenerating && (
                    <div className="p-6 sm:px-12 border-t border-white/5 bg-[#0a0a0a] flex items-center justify-between shrink-0 relative z-10 w-full">
                        <button
                            onClick={handleBack}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all text-neutral-400 hover:text-white hover:bg-white/10",
                                currentQuestion === 0 && "opacity-0 pointer-events-none"
                            )}
                        >
                            <ArrowLeft className="w-5 h-5" /> Back
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={!canProceed()}
                            className={cn(
                                "px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-lg",
                                canProceed()
                                    ? "bg-primary hover:bg-primary/90 text-black shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:scale-105"
                                    : "bg-white/5 text-neutral-500 cursor-not-allowed"
                            )}
                        >
                            {isLastQuestion ? (
                                <>Sign &amp; Confirm <CheckCircle2 className="w-5 h-5" /></>
                            ) : (
                                <>Next <ArrowRight className="w-5 h-5" /></>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
