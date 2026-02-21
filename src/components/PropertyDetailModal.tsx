
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import {
    Heart, Share, Navigation, X, RotateCw, Bed, Bath, LayoutTemplate,
    Wifi, Snowflake, Dumbbell, WashingMachine, Droplets, Wind, ChevronUp,
    Flame, Car, UtensilsCrossed, Shield, Tv, CircleUser, CheckCircle2, Ban,
    Send, MessageSquare, ChevronsDown, Zap, Users, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Property } from "@/lib/data";

interface PropertyDetailModalProps {
    property: Property | null;
    isLiked: boolean;
    onLike: (id: string) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

import { useState } from "react";

export default function PropertyDetailModal({ property, isLiked, onLike, open, onOpenChange }: PropertyDetailModalProps) {
    const [activeTab, setActiveTab] = useState<"details" | "reviews">("details");

    const [rulesOpen, setRulesOpen] = useState(false);
    const [messageOpen, setMessageOpen] = useState(false);
    const [messageSent, setMessageSent] = useState(false);
    const [messageText, setMessageText] = useState("");


    if (!property) return null;

    return (
        <>
            <Dialog.Root open={open} onOpenChange={onOpenChange}>
                <Dialog.Portal>
                    <Dialog.Overlay className="modal-overlay fixed inset-0 bg-black/70 z-[60]" />
                    <Dialog.Content className="modal-content fixed left-[50%] top-[50%] h-[90vh] max-h-[90vh] w-[95vw] max-w-[1100px] rounded-2xl bg-background shadow-2xl focus:outline-none z-[70] flex border border-neutral-800/50 overflow-hidden">

                        {/* Left: Image Gallery */}
                        <div className="hidden md:flex flex-col w-[60%] bg-black relative">
                            <div className="relative h-[65%] w-full">
                                <Image
                                    src={property.images[0]}
                                    alt={property.name}
                                    fill
                                    className="object-cover"
                                />
                                {/* Top Left Controls */}
                                <div className="absolute top-4 left-4 flex gap-2">
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
                                {/* Virtual Tour Badge */}
                                <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold tracking-wider uppercase text-white border border-white/10">
                                    Virtual Tour Available
                                </div>
                            </div>
                            <div className="h-[35%] w-full grid grid-cols-3 gap-1 p-1 bg-background">
                                {property.images.slice(1, 4).map((img, i) => (
                                    <div key={i} className="relative h-full w-full rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                                        <Image src={img} alt={`Gallery ${i}`} fill className="object-cover" />
                                    </div>
                                ))}
                            </div>
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
                                                    {property.amenities.map((amenity, i) => (
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


                                            {/* Rules */}
                                            <div>
                                                <h3 className="text-sm font-bold text-white mb-3">House Rules</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {property.houseRules.map((rule, i) => (
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
                                    <button className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20">
                                        <Send className="h-4 w-4" />
                                        Rent Now
                                    </button>
                                    <button
                                        onClick={() => setRulesOpen(true)}
                                        className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all border border-neutral-700">
                                        <Ban className="h-4 w-4" />
                                        Apt Rules
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

            {/* Apt Rules Modal */}
            <Dialog.Root open={rulesOpen} onOpenChange={setRulesOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="modal-overlay fixed inset-0 bg-black/80 z-[80] backdrop-blur-sm" />
                    <Dialog.Content className="modal-content fixed left-[50%] top-[50%] h-auto max-h-[85vh] w-[90vw] max-w-[600px] rounded-2xl bg-neutral-900 shadow-2xl focus:outline-none z-[90] flex flex-col border border-neutral-800 overflow-hidden">

                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-neutral-800 bg-neutral-900 w-full z-10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neutral-800 rounded-lg">
                                    <Ban className="h-5 w-5 text-neutral-400" />
                                </div>
                                <Dialog.Title className="text-xl font-bold text-white">Apartment Rules</Dialog.Title>
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
                                    {property.houseRules.map((rule, i) => (
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
                                <button className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all border border-neutral-700">
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
                    <Dialog.Overlay className="modal-overlay fixed inset-0 bg-black/80 z-[80] backdrop-blur-sm" />
                    <Dialog.Content className="modal-content fixed left-[50%] top-[50%] w-[90vw] max-w-[500px] rounded-2xl bg-neutral-900 shadow-2xl focus:outline-none z-[90] flex flex-col border border-neutral-800 overflow-hidden">
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
                                                    if (messageText.trim()) {
                                                        setMessageSent(true);
                                                    }
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
