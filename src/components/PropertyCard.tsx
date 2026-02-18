
import Image from "next/image";
import { Heart, Star, MapPin, Bed, Bath, LayoutGrid, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Property } from "@/lib/data";

interface PropertyCardProps {
    property: Property;
    isLiked: boolean;
    onLike: (id: string) => void;
    onClick: (p: Property) => void;
}

export default function PropertyCard({ property, isLiked, onLike, onClick }: PropertyCardProps) {
    return (
        <div
            onClick={() => onClick(property)}
            className="group relative h-[480px] w-full bg-neutral-900 rounded-[2rem] overflow-hidden cursor-pointer shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1"
        >
            {/* Full Background Image */}
            <div className="absolute inset-0">
                <Image
                    src={property.images[0]}
                    alt={property.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Gradient Overlay - darker at bottom for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            </div>

            {/* Top Floating Elements */}
            <div className="absolute top-5 left-5 right-5 flex justify-between items-start z-10">
                {/* Price Pill */}
                <div className="bg-neutral-900/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center">
                    <span className="font-bold text-white text-sm">
                        {property.price} <span className="font-normal text-white/80 text-xs">/mo</span>
                    </span>
                </div>

                {/* Favorite Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onLike(property.id);
                    }}
                    className={cn(
                        "h-10 w-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-all group/btn",
                        isLiked
                            ? "bg-red-500/20 border-red-500 text-red-500 hover:bg-red-500/30"
                            : "bg-neutral-900/40 border-white/10 text-white hover:bg-neutral-900/60"
                    )}
                >
                    <Heart className={cn("h-5 w-5 transition-colors", isLiked ? "fill-current" : "group-hover/btn:text-red-500")} />
                </button>
            </div>

            {/* Bottom Content Content */}
            <div className="absolute bottom-0 left-0 right-0 p-5 z-20 flex flex-col gap-4">
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <h3 className="font-bold text-white text-xl tracking-tight leading-snug truncate pr-2">
                            {property.name}
                        </h3>
                        <div className="flex items-center gap-1 text-orange-400 flex-shrink-0 bg-neutral-900/30 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-white/5">
                            <Star className="h-3.5 w-3.5 fill-orange-400" />
                            <span className="text-sm font-bold text-white">4.8</span>
                            <span className="text-xs text-neutral-400">(20)</span>
                        </div>
                    </div>

                    <p className="text-neutral-300 text-sm flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-neutral-400" />
                        <span className="truncate">{property.address}</span>
                    </p>
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-white/20" />

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 text-white/90">
                    <div className="flex items-center gap-2">
                        <Bed className="h-4 w-4 text-neutral-400" />
                        <span className="text-xs font-medium">{property.beds} Bedrooms</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Bath className="h-4 w-4 text-neutral-400" />
                        <span className="text-xs font-medium">{property.baths} Bathrooms</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <LayoutGrid className="h-4 w-4 text-neutral-400" />
                        <span className="text-xs font-medium">{property.sqft} Sqft</span>
                    </div>
                </div>

                {/* Action Button */}
                <button className="w-full bg-white text-black font-bold text-sm py-3.5 rounded-full flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors shadow-lg active:scale-[0.98]">
                    <Calendar className="h-4 w-4" />
                    View Details
                </button>
            </div>
        </div>
    );
}
