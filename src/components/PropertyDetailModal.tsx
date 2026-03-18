
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import {
    Heart, Share, Navigation, X, RotateCw, Bed, Bath, LayoutTemplate,
    Wifi, Snowflake, Dumbbell, WashingMachine, Droplets, Wind, ChevronUp,
    Flame, Car, UtensilsCrossed, Shield, Tv, CircleUser, CheckCircle2, Ban,
    Send, MessageSquare, ChevronsDown, Zap, Users, Trash2,
    ChevronLeft, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Property } from "@/lib/data";
import type { FeedProperty } from "@/hooks/useProperties";
import Link from "next/link";
interface PropertyDetailModalProps {
    property: Property | FeedProperty | null;
    isLiked: boolean;
    onLike: (id: string) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

import { useState, useEffect, useRef } from "react";

const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export default function PropertyDetailModal({ property, isLiked, onLike, open, onOpenChange }: PropertyDetailModalProps) {
    const [activeTab, setActiveTab] = useState<"details" | "reviews">("details");
    const [activeImage, setActiveImage] = useState(0);
    const thumbsRef = useRef<HTMLDivElement>(null);
    const lastTrackedListingRef = useRef<string | null>(null);

    const [rulesOpen, setRulesOpen] = useState(false);
    const [hasReadRules, setHasReadRules] = useState(false);
    const [messageOpen, setMessageOpen] = useState(false);
    const [messageSent, setMessageSent] = useState(false);
    const [messageText, setMessageText] = useState("");

    // Reset to first image whenever a new property is opened
    useEffect(() => {
        if (open) setActiveImage(0);
    }, [open, property?.id]);

    useEffect(() => {
        if (open) setHasReadRules(false);
    }, [open, property?.id]);

    useEffect(() => {
        if (!open) {
            lastTrackedListingRef.current = null;
            return;
        }

        if (!property?.id || !isUuid(property.id)) return;
        if (lastTrackedListingRef.current === property.id) return;

        lastTrackedListingRef.current = property.id;

        void fetch(`/api/listings/${property.id}/events`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "view" }),
        }).catch(() => undefined);
    }, [open, property?.id]);


    if (!property) return null;

    return (
        <>
            <Dialog.Root open={open} onOpenChange={onOpenChange}>
                <Dialog.Portal>
                    <Dialog.Overlay className="modal-overlay fixed inset-0 bg-black/70 z-[110]" />
                    <Dialog.Content className="modal-content fixed left-[50%] top-[50%] h-[90vh] max-h-[90vh] w-[95vw] max-w-[1100px] rounded-2xl bg-background shadow-2xl focus:outline-none z-[120] flex border border-neutral-800/50 overflow-hidden">

                        {/* Left: Image Carousel */}
                        <div className="hidden md:flex flex-col w-[60%] bg-black relative select-none">

                            {/* ── Main viewer ── */}
                            <div className="relative flex-1 w-full overflow-hidden">
                                <Image
                                    key={activeImage}
                                    src={property.images[activeImage]}
                                    alt={`${property.name} – photo ${activeImage + 1}`}
                                    fill
                                    className="object-cover transition-opacity duration-300"
                                    priority
                                />

                                {/* Dark vignette at bottom for readability */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                                {/* Top-left action buttons */}
                                <div className="absolute top-4 left-4 flex gap-2 z-10">
                                    <button
                                        onClick={() => property && onLike(property.id)}
                                        className={cn(
                                            "h-8 w-8 rounded-full backdrop-blur-md flex items-center justify-center transition-colors",
                                            isLiked
                                                ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                                                : "bg-white/10 text-white hover:bg-white/20"
                                        )}>
                                        <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                                    </button>
                                    <button className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                                        <Share className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Photo counter badge */}
                                <div className="absolute top-4 right-4 z-10 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10">
                                    {activeImage + 1} / {property.images.length}
                                </div>

                                {/* Prev / Next arrows — only shown if more than one image */}
                                {property.images.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => setActiveImage(i => (i - 1 + property.images.length) % property.images.length)}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/70 transition-all hover:scale-105 active:scale-95"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => setActiveImage(i => (i + 1) % property.images.length)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/70 transition-all hover:scale-105 active:scale-95"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </>
                                )}

                                {/* Dot indicators */}
                                {property.images.length > 1 && (
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
                                        {property.images.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setActiveImage(i)}
                                                className={cn(
                                                    "rounded-full transition-all duration-200",
                                                    i === activeImage
                                                        ? "w-5 h-2 bg-white"
                                                        : "w-2 h-2 bg-white/40 hover:bg-white/70"
                                                )}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ── Thumbnail strip ── */}
                            {property.images.length > 1 && (
                                <div
                                    ref={thumbsRef}
                                    className="flex gap-2 px-3 py-3 bg-neutral-950 overflow-x-auto custom-scrollbar shrink-0"
                                    style={{ maxHeight: "110px" }}
                                >
                                    {property.images.map((img: string, i: number) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveImage(i)}
                                            className={cn(
                                                "relative shrink-0 rounded-lg overflow-hidden transition-all duration-200 border-2",
                                                "w-[80px] h-[70px]",
                                                i === activeImage
                                                    ? "border-primary scale-105 shadow-lg shadow-primary/30"
                                                    : "border-transparent opacity-60 hover:opacity-90 hover:border-white/30"
                                            )}
                                        >
                                            <Image src={img} alt={i === 0 ? "Main" : `Photo ${i + 1}`} fill className="object-cover" />
                                            {/* Label overlay */}
                                            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] font-bold text-white text-center py-0.5 truncate px-1">
                                                {i === 0 ? "Main" : `Photo ${i + 1}`}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right: Details */}
                        <div className="flex-1 flex flex-col h-full bg-card text-neutral-200 overflow-hidden relative min-h-0">

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <Dialog.Title className="text-2xl font-bold text-white mb-1">{property.name}</Dialog.Title>
                                        <div className="flex items-center text-neutral-400 text-xs">
                                            <Navigation className="h-3 w-3 mr-1" />
                                            {property.address}
                                        </div>
                                    </div>
                                    <Dialog.Close className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors">
                                        <X className="h-4 w-4" />
                                    </Dialog.Close>
                                </div>

                                <div className="flex items-end gap-3">
                                    <span className="text-3xl font-bold text-primary">₱{property.numericPrice.toLocaleString()}<span className="text-sm font-normal text-neutral-400">/mo</span></span>
                                    <span className="px-2 py-1 bg-status-occupied/10 text-status-occupied text-[10px] font-bold uppercase rounded border border-status-occupied/20 mb-1 flex items-center gap-1">
                                        <RotateCw className="h-3 w-3" /> 5% Below Market
                                    </span>
                                </div>

                                <div className="flex gap-6 py-4 border-y border-neutral-800">
                                    <div className="flex items-center gap-2">
                                        <Bed className="h-5 w-5 text-neutral-400" />
                                        <span className="text-sm font-medium">{property.beds} Beds</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Bath className="h-5 w-5 text-neutral-400" />
                                        <span className="text-sm font-medium">{property.baths} Baths</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <LayoutTemplate className="h-5 w-5 text-neutral-400" />
                                        <span className="text-sm font-medium">{property.sqft.toLocaleString()} sqft</span>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="flex p-1 bg-neutral-900/50 rounded-lg">
                                    <button
                                        onClick={() => setActiveTab("details")}
                                        className={cn(
                                            "flex-1 py-2 rounded-md text-sm font-bold transition-all",
                                            activeTab === "details"
                                                ? "bg-primary text-white shadow-sm"
                                                : "text-neutral-400 hover:text-white"
                                        )}
                                    >
                                        Details
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("reviews")}
                                        className={cn(
                                            "flex-1 py-2 rounded-md text-sm font-bold transition-all",
                                            activeTab === "reviews"
                                                ? "bg-primary text-white shadow-sm"
                                                : "text-neutral-400 hover:text-white"
                                        )}
                                    >
                                        Reviews
                                    </button>
                                </div>

                                {/* Content */}
                                <div key={activeTab} className="fade-slide-up">
                                    {activeTab === "details" ? (
                                        <div className="space-y-8">
                                            {/* Description */}
                                            <p className="text-sm text-neutral-400 leading-relaxed">
                                                {property.description}
                                            </p>

                                            {/* Amenities */}
                                            <div>
                                                <h3 className="text-sm font-bold text-white mb-3">Amenities</h3>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {property.amenities.map((amenity: string, i: number) => (
                                                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                                                            <div className="p-1.5 rounded bg-primary/10 text-primary">
                                                                {(() => {
                                                                    const lower = amenity.toLowerCase();
                                                                    if (lower.includes("wifi")) return <Wifi className="h-4 w-4" />;
                                                                    if (lower.includes("air") || lower.includes("ac")) return <Snowflake className="h-4 w-4" />;
                                                                    if (lower.includes("gym")) return <Dumbbell className="h-4 w-4" />;
                                                                    if (lower.includes("washer") || lower.includes("laundry")) return <WashingMachine className="h-4 w-4" />;
                                                                    if (lower.includes("pool")) return <Droplets className="h-4 w-4" />;
                                                                    if (lower.includes("balcony")) return <Wind className="h-4 w-4" />;
                                                                    if (lower.includes("elevator")) return <ChevronUp className="h-4 w-4" />;
                                                                    if (lower.includes("fireplace")) return <Flame className="h-4 w-4" />;
                                                                    if (lower.includes("parking")) return <Car className="h-4 w-4" />;
                                                                    if (lower.includes("kitchen")) return <UtensilsCrossed className="h-4 w-4" />;
                                                                    if (lower.includes("security")) return <Shield className="h-4 w-4" />;
                                                                    if (lower.includes("tv") || lower.includes("cable")) return <Tv className="h-4 w-4" />;
                                                                    if (lower.includes("wheelchair")) return <CircleUser className="h-4 w-4" />;
                                                                    return <CheckCircle2 className="h-4 w-4" />;
                                                                })()}
                                                            </div>
                                                            <span className="text-xs font-medium text-neutral-300">{amenity}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            {/* Acceptance Requirements */}
                                            <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                                        <Shield className="h-4 w-4 text-primary" />
                                                        Tenant Acceptance Requirements
                                                    </h3>
                                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Mandatory</span>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {[
                                                        { label: "Valid Identification", desc: "Govt ID (Name must match match exactly)" },
                                                        { label: "Source of Income Verification", desc: "COE, Payslip, or Work Contract" },
                                                        { label: "Completed Application Form", desc: "Basic personal & job details" },
                                                        { label: "Background / Reference Check", desc: "Employer or previous landlord check" },
                                                        { label: "Move-in Payments (Upfront)", desc: "1mo Advance + 2mo Security Deposit" },
                                                        { label: "Lease Contract Signing", desc: "No signature, no key" },
                                                        { label: "Inspection & Turnover", desc: "Photo/Video & Signed Checklist" },
                                                    ].map((req, i) => (
                                                        <div key={i} className="flex items-start gap-3 group">
                                                            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0 group-hover:scale-125 transition-transform" />
                                                            <div className="space-y-0.5">
                                                                <p className="text-[11px] font-bold text-neutral-200">{req.label}</p>
                                                                <p className="text-[10px] text-neutral-500 font-medium leading-tight">{req.desc}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="pt-2 border-t border-white/5">
                                                    <p className="text-[10px] text-red-400 font-bold italic leading-relaxed">
                                                        ❌ No installments. No "pay later" arrangements.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Rules */}
                                            <div>
                                                <h3 className="text-sm font-bold text-white mb-3">House Rules</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {property.houseRules.map((rule: string, i: number) => (
                                                        <span key={i} className={cn(
                                                            "px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5",
                                                            rule.includes("No")
                                                                ? "bg-status-maintenance/10 text-status-maintenance border-status-maintenance/20"
                                                                : "bg-status-occupied/10 text-status-occupied border-status-occupied/20"
                                                        )}>
                                                            {rule.includes("No") ? <Ban className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                                                            {rule}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                                                <div className="flex flex-col items-center justify-center p-4 bg-background rounded-lg border border-neutral-800">
                                                    <span className="text-3xl font-bold text-white">4.8</span>
                                                    <div className="flex gap-0.5 mt-1">
                                                        {[1, 2, 3, 4, 5].map(i => (
                                                            <Heart key={i} className={cn("h-3 w-3 fill-primary text-primary")} />
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] text-neutral-500 mt-1">12 Reviews</span>
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                                                        <span className="w-16">Cleanliness</span>
                                                        <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-primary w-[95%]" />
                                                        </div>
                                                        <span className="w-6 text-right">4.9</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                                                        <span className="w-16">Accuracy</span>
                                                        <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-primary w-[98%]" />
                                                        </div>
                                                        <span className="w-6 text-right">5.0</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                                                        <span className="w-16">Location</span>
                                                        <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-primary w-[92%]" />
                                                        </div>
                                                        <span className="w-6 text-right">4.7</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {[1, 2, 3].map((i) => (
                                                    <div key={i} className="pb-4 border-b border-neutral-800 last:border-0">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center">
                                                                <CircleUser className="h-5 w-5 text-neutral-400" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-white">John Doe</div>
                                                                <div className="text-[10px] text-neutral-500">October 2023</div>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-neutral-400 leading-relaxed">
                                                            "Absolute gem! The location is perfect, close to everything but still quiet. The apartment was spotless and the host was super responsive. Highly recommend!"
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 md:p-8 border-t border-neutral-800 bg-card z-10">
                                <div className="flex gap-3">
                                    <Link
                                        href={`/tenant/applications/${property.id}/apply`}
                                        aria-disabled={!hasReadRules}
                                        tabIndex={hasReadRules ? 0 : -1}
                                        onClick={(event) => {
                                            if (!hasReadRules) {
                                                event.preventDefault();
                                                setRulesOpen(true);
                                            }
                                        }}
                                        className={cn(
                                            "group relative flex-1 text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-3 transition-all overflow-hidden",
                                            hasReadRules
                                                ? "bg-primary hover:bg-primary-dark shadow-xl shadow-primary/20 active:scale-[0.98]"
                                                : "bg-primary/40 cursor-not-allowed pointer-events-auto"
                                        )}
                                    >
                                        {hasReadRules && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />}
                                        <Send className={cn("h-4 w-4 transition-transform", hasReadRules && "group-hover:translate-x-1 group-hover:-translate-y-1")} />
                                        <span className="relative z-10">Rent Now</span>
                                    </Link>
                                    <button
                                        onClick={() => setRulesOpen(true)}
                                        className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all border border-neutral-700">
                                        <Ban className="h-4 w-4" />
                                        Rules
                                    </button>
                                    <button
                                        onClick={() => {
                                            setMessageSent(false);
                                            setMessageText("");
                                            setMessageOpen(true);
                                        }}
                                        className="h-12 w-12 rounded-xl border border-neutral-700 bg-neutral-800 flex items-center justify-center flex-shrink-0 text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors">
                                        <MessageSquare className="h-5 w-5" />
                                    </button>
                                </div>
                                <p className="text-center text-[10px] text-neutral-500 mt-3">Usually responds within 2 hours</p>
                            </div>
                        </div>

                    </Dialog.Content>
                </Dialog.Portal>

                <style jsx global>{`
                @keyframes fadeSlideUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .fade-slide-up {
                    animation: fadeSlideUp 0.4s ease-out forwards;
                }

                /* Overlay animations */
                @keyframes overlayFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes overlayFadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }

                /* Modal content animations */
                @keyframes modalEnter {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -48%) scale(0.96);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                }
                @keyframes modalExit {
                    from {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                    to {
                        opacity: 0;
                        transform: translate(-50%, -48%) scale(0.96);
                    }
                }



                [data-state="open"].modal-overlay {
                    animation: overlayFadeIn 0.2s ease-out forwards;
                }
                [data-state="closed"].modal-overlay {
                    animation: overlayFadeOut 0.15s ease-in forwards;
                }

                [data-state="open"].modal-content {
                    animation: modalEnter 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                [data-state="closed"].modal-content {
                    animation: modalExit 0.15s ease-in forwards;
                }
            `}</style>
            </Dialog.Root>

            {/* Rules Modal */}
            <Dialog.Root open={rulesOpen} onOpenChange={setRulesOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="modal-overlay fixed inset-0 bg-black/80 z-[130] backdrop-blur-sm" />
                    <Dialog.Content className="modal-content fixed left-[50%] top-[50%] h-auto max-h-[85vh] w-[90vw] max-w-[600px] rounded-2xl bg-neutral-900 shadow-2xl focus:outline-none z-[140] flex flex-col border border-neutral-800 overflow-hidden">

                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-neutral-800 bg-neutral-900 w-full z-10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neutral-800 rounded-lg">
                                    <Ban className="h-5 w-5 text-neutral-400" />
                                </div>
                                <Dialog.Title className="text-xl font-bold text-white">Rules</Dialog.Title>
                            </div>
                            <Dialog.Close className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors">
                                <X className="h-4 w-4" />
                            </Dialog.Close>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            {/* Detailed Rules List */}
                            <div className="space-y-6">
                                {/* Quiet Hours */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider text-neutral-400">Quiet Hours</h3>
                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-800/50 border border-neutral-800/80">
                                        <div className="mt-0.5 flex-shrink-0 p-1.5 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                            <ChevronsDown className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-white">10:00 PM to 7:00 AM (Daily)</p>
                                            <p className="text-xs text-neutral-400 leading-relaxed">
                                                No loud music, heavy machinery, or disruptive activities. Please respect the peaceful environment for all residents during these hours.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Utilities & Bills */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider text-neutral-400">Utilities & Bills</h3>
                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-800/50 border border-neutral-800/80">
                                        <div className="mt-0.5 flex-shrink-0 p-1.5 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
                                            <Zap className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-white">Sub-metered billing</p>
                                            <p className="text-xs text-neutral-400 leading-relaxed">
                                                Electricity and water are individually sub-metered. Bills are generated on the 25th of each month and must be settled within 5 business days via the portal or bank transfer.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Visitors & Guests */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider text-neutral-400">Visitors & Guests</h3>
                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-800/50 border border-neutral-800/80">
                                        <div className="mt-0.5 flex-shrink-0 p-1.5 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center">
                                            <Users className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-white">Registration required</p>
                                            <p className="text-xs text-neutral-400 leading-relaxed">
                                                All day guests must log in at the security desk. Overnight guests are permitted for a maximum of 3 consecutive nights and must be pre-registered with building management.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Trash Disposal */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider text-neutral-400">Trash Disposal</h3>
                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-800/50 border border-neutral-800/80">
                                        <div className="mt-0.5 flex-shrink-0 p-1.5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-white">Segregation & Schedule</p>
                                            <p className="text-xs text-neutral-400 leading-relaxed">
                                                Proper waste segregation is strictly enforced. Daily garbage collection happens at 8:00 AM. Please leave sealed bags outside your door by 7:30 AM.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Additional House Rules list from property data */}
                            <div>
                                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-neutral-400">General Rules</h3>
                                <div className="space-y-3">
                                    {property.houseRules.map((rule: string, i: number) => (
                                        <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-neutral-800/50 border border-neutral-800/80">
                                            <div className={cn(
                                                "mt-0.5 flex-shrink-0 p-1.5 rounded-full flex items-center justify-center",
                                                rule.includes("No")
                                                    ? "bg-red-500/10 text-red-500"
                                                    : "bg-green-500/10 text-green-500"
                                            )}>
                                                {rule.includes("No") ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-neutral-200">{rule}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Fines Section */}
                            <div>
                                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-neutral-400">Violations & Fines</h3>
                                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 space-y-4">
                                    <p className="text-sm text-neutral-400 leading-relaxed">
                                        Failure to comply with the apartment rules may result in formal warnings or financial penalties as outlined in the lease agreement. Repeating offenses may lead to eviction.
                                    </p>
                                    <ul className="text-sm text-neutral-400 list-disc list-inside space-y-2">
                                        <li>Noise complaints: ₱1,500 fine per incident.</li>
                                        <li>Unauthorized pets: ₱5,000 fine + cleaning fees.</li>
                                        <li>Improper waste disposal: ₱1,000 fine per bag.</li>
                                        <li>Smoking indoors: ₱10,000 deep cleaning fee.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-neutral-800 bg-neutral-900 shrink-0">
                            <Dialog.Close asChild>
                                <button
                                    onClick={() => setHasReadRules(true)}
                                    className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all border border-neutral-700"
                                >
                                    I Understand
                                </button>
                            </Dialog.Close>
                        </div>

                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
            {/* Message Modal */}
            <Dialog.Root open={messageOpen} onOpenChange={setMessageOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="modal-overlay fixed inset-0 bg-black/80 z-[130] backdrop-blur-sm" />
                    <Dialog.Content className="modal-content fixed left-[50%] top-[50%] w-[90vw] max-w-[500px] rounded-2xl bg-neutral-900 shadow-2xl focus:outline-none z-[140] flex flex-col border border-neutral-800 overflow-hidden">
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-neutral-800 bg-neutral-900 w-full z-10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neutral-800 rounded-lg">
                                    <MessageSquare className="h-5 w-5 text-neutral-400" />
                                </div>
                                <Dialog.Title className="text-xl font-bold text-white">Message Manager</Dialog.Title>
                            </div>
                            <Dialog.Close className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors">
                                <X className="h-4 w-4" />
                            </Dialog.Close>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {messageSent ? (
                                <div className="py-12 flex flex-col items-center text-center fade-slide-up">
                                    <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-6 border border-primary/30">
                                        <CheckCircle2 className="h-8 w-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
                                    <p className="text-sm text-neutral-400 max-w-[280px]">
                                        The property manager typically responds within 2 hours. Keep an eye on your inbox.
                                    </p>
                                    <button
                                        onClick={() => setMessageOpen(false)}
                                        className="mt-8 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 px-8 rounded-xl text-sm transition-all border border-neutral-700">
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <div className="fade-slide-up">
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-800/50 border border-neutral-800/80 mb-6">
                                        <div className="h-10 w-10 rounded-full overflow-hidden relative border border-neutral-700">
                                            <Image src={property.images[0]} alt="Property" fill className="object-cover" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{property.name}</p>
                                            <p className="text-xs text-neutral-400">{property.address}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Your Message</label>
                                            <textarea
                                                value={messageText}
                                                onChange={(e) => setMessageText(e.target.value)}
                                                placeholder="Hi, I'm interested in this property and would like to know more..."
                                                className="w-full h-32 bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 resize-none transition-all custom-scrollbar"
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <Dialog.Close asChild>
                                                <button className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all border border-neutral-700">
                                                    Cancel
                                                </button>
                                            </Dialog.Close>
                                            <button
                                                onClick={() => {
                                                    if (!messageText.trim()) return;

                                                    if (property?.id && isUuid(property.id)) {
                                                        void fetch(`/api/listings/${property.id}/events`, {
                                                            method: "POST",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({ type: "lead" }),
                                                        }).catch(() => undefined);
                                                    }

                                                    setMessageSent(true);
                                                }}
                                                disabled={!messageText.trim()}
                                                className="flex-1 bg-primary hover:bg-primary-dark disabled:bg-primary/50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20">
                                                <Send className="h-4 w-4" />
                                                Send Message
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </>
    );
}
