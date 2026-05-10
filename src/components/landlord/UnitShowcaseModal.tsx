"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    X,
    Home,
    Ruler,
    BedDouble,
    Bath,
    Banknote,
    Layers,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";

interface UnitShowcaseData {
    id: string;
    name: string;
    floor: number | null;
    area_sqm: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    rent_amount: number | null;
    status: string;
    description?: string;
    property: {
        id: string;
        name: string;
        address: string;
        amenities: string[];
        images: string[];
        type: string;
    };
}

interface UnitShowcaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    unit: UnitShowcaseData | null;
    onStartApplication?: (unitId: string) => void;
}

const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&auto=format&fit=crop&q=80";

export function UnitShowcaseModal({
    isOpen,
    onClose,
    unit,
    onStartApplication,
}: UnitShowcaseModalProps) {
    const [currentImage, setCurrentImage] = useState(0);

    if (!isOpen || !unit) return null;

    const images = unit.property.images?.length > 0 ? unit.property.images : [FALLBACK_IMAGE];

    const prevImage = () => setCurrentImage((i) => (i === 0 ? images.length - 1 : i - 1));
    const nextImage = () => setCurrentImage((i) => (i === images.length - 1 ? 0 : i + 1));

    const details = [
        { label: "Floor", value: unit.floor || "—", icon: Layers },
        { label: "Area", value: unit.area_sqm ? `${unit.area_sqm} sqm` : "—", icon: Ruler },
        { label: "Bedrooms", value: unit.bedrooms ?? "—", icon: BedDouble },
        { label: "Bathrooms", value: unit.bathrooms ?? "—", icon: Bath },
    ];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0e0e0e] border border-white/10 rounded-3xl shadow-2xl z-10"
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-20 p-2 text-neutral-400 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors backdrop-blur-sm"
                >
                    <X className="size-5" />
                </button>

                {/* Image Gallery */}
                <div className="relative w-full h-[320px] sm:h-[400px] overflow-hidden rounded-t-3xl">
                    <Image
                        src={images[currentImage]}
                        alt={unit.name}
                        fill
                        className="object-cover transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-transparent to-transparent" />

                    {images.length > 1 && (
                        <>
                            <button
                                onClick={prevImage}
                                className="absolute left-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                                onClick={nextImage}
                                className="absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>

                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                                {images.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentImage(i)}
                                        className={cn(
                                            "size-2 rounded-full transition-all",
                                            i === currentImage
                                                ? "bg-white w-6"
                                                : "bg-white/40 hover:bg-white/60"
                                        )}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Property badge on image */}
                    <div className="absolute top-6 left-6 z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs font-bold text-white">
                            <Home className="h-3.5 w-3.5 text-primary" />
                            {unit.property.name}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 space-y-6 -mt-8 relative z-10">
                    {/* Unit title & rent */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tight">
                                {unit.name}
                            </h2>
                            <p className="text-neutral-400 text-sm mt-1">
                                {unit.property.address} · {unit.property.type}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-black text-primary">
                                ₱{(unit.rent_amount || 0).toLocaleString()}
                            </p>
                            <p className="text-neutral-500 text-sm font-medium">per month</p>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {details.map((d) => (
                            <div
                                key={d.label}
                                className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col items-center gap-2"
                            >
                                <d.icon className="h-5 w-5 text-primary" />
                                <p className="text-white font-bold text-lg">{d.value}</p>
                                <p className="text-neutral-500 text-xs font-medium uppercase tracking-wider">
                                    {d.label}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Description */}
                    {unit.description && (
                        <div className="bg-white/5 border border-white/5 rounded-xl p-5">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
                                Description
                            </h3>
                            <p className="text-neutral-300 text-sm leading-relaxed">
                                {unit.description}
                            </p>
                        </div>
                    )}

                    {/* Amenities */}
                    {unit.property.amenities?.length > 0 && (
                        <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3 flex items-center gap-2">
                                <Sparkles className="h-3.5 w-3.5" />
                                Amenities
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {unit.property.amenities.map((amenity, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium"
                                    >
                                        {amenity}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CTA */}
                    {onStartApplication && unit.status !== "occupied" && (
                        <button
                            onClick={() => {
                                onStartApplication(unit.id);
                                onClose();
                            }}
                            className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-black font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(var(--primary),0.3)]"
                        >
                            <ClipboardList className="h-5 w-5" />
                            Start Tenant Application
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

