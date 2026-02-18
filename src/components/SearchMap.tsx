
"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Image from "next/image";
import { Star, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

// Helper to center markers
function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, 14);
    }, [center, map]);
    return null;
}

// Enforce map bounds and zoom limits
const METRO_MANILA_BOUNDS: L.LatLngBoundsExpression = [
    [14.35, 120.85],  // Southwest
    [14.85, 121.15],  // Northeast
];

function MapBoundsEnforcer() {
    const map = useMap();
    useEffect(() => {
        map.setMinZoom(11);
        map.setMaxZoom(18);
        map.setMaxBounds(METRO_MANILA_BOUNDS);
        map.options.maxBoundsViscosity = 1.0;
    }, [map]);
    return null;
}

const createCustomIcon = (price: string, isSelected: boolean) => {
    return L.divIcon({
        className: "custom-marker",
        html: `<div class="${isSelected
            ? "bg-primary text-white z-50 scale-110"
            : "bg-card text-white border border-neutral-700"
            } px-3 py-1 rounded-full text-xs font-bold shadow-xl transition-all transform hover:scale-105 flex items-center justify-center whitespace-nowrap">
      ${price}
    </div>`,
        iconSize: [60, 30],
        iconAnchor: [30, 40],
        popupAnchor: [0, -40],
    });
};

const createLocationIcon = () => {
    return L.divIcon({
        className: "location-marker",
        html: `<div class="relative flex items-center justify-center">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white shadow-md"></span>
    </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    });
};

const createSearchIcon = () => {
    return L.divIcon({
        className: "search-marker",
        html: `<div class="flex items-center justify-center text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="drop-shadow-xl"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" fill="currentColor" stroke="white" stroke-width="2"/><circle cx="12" cy="10" r="3" fill="white"/></svg>
    </div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 48],
        popupAnchor: [0, -48],
    });
};

interface Property {
    id: string;
    name: string;
    address: string;
    price: string;
    numericPrice: number;
    beds: number;
    baths: number;
    sqft: number;
    lat: number;
    lng: number;
    amenities: string[];
    description: string;
    houseRules: string[];
    images: string[];
    matchScore: number;
    isNew?: boolean;
}

interface SearchMapProps {
    properties: Property[];
    selectedProperty: Property | null;
    onMarkerClick: (property: Property) => void;
    onDetailsClick: (property: Property) => void;
    radius?: number; // Radius in km
    center?: [number, number];
    viewCenter?: [number, number];
    location?: [number, number];
    likedProperties: Set<string>;
    onLike: (id: string) => void;
}

export default function SearchMap({
    properties,
    selectedProperty,
    onMarkerClick,
    onDetailsClick,
    radius = 5,
    center = [14.6865, 121.0366],
    viewCenter,
    location,
    likedProperties,
    onLike
}: SearchMapProps) {

    useEffect(() => {
        // @ts-ignore
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
    }, []);

    const isLiked = selectedProperty ? likedProperties.has(selectedProperty.id) : false;

    return (
        <div className="h-full w-full relative">
            <MapContainer
                center={center}
                zoom={14}
                minZoom={11}
                maxZoom={18}
                maxBounds={[
                    [14.35, 120.85],  // Southwest corner (south of Las Piñas / west of Cavite)
                    [14.85, 121.15],  // Northeast corner (north of Bulacan / east of Rizal)
                ]}
                maxBoundsViscosity={1.0}
                className="h-full w-full z-0"
                zoomControl={false}
                style={{ background: '#f8fafc', minHeight: '100%' }}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                <MapBoundsEnforcer />
                <MapUpdater center={viewCenter || center} />

                {/* Search Result Marker */}
                <Marker position={center} icon={createSearchIcon()} />

                {/* User Current Location Marker */}
                {location && (
                    <Marker position={location} icon={createLocationIcon()} />
                )}

                {/* Search Radius Circle */}
                <Circle
                    center={center}
                    radius={radius * 1000} // Convert km to meters
                    pathOptions={{
                        fillColor: 'var(--color-primary)',
                        fillOpacity: 0.1,
                        color: 'var(--color-primary)',
                        weight: 1,
                        opacity: 0.3
                    }}
                />

                {properties.map((p) => {
                    const isSelected = selectedProperty?.id === p.id;
                    return (
                        <Marker
                            key={p.id}
                            position={[p.lat, p.lng]}
                            icon={createCustomIcon(p.price, isSelected)}
                            eventHandlers={{
                                click: () => onMarkerClick(p),
                            }}
                        />
                    );
                })}

                {selectedProperty && (
                    <Popup
                        position={[selectedProperty.lat, selectedProperty.lng]}
                        className="custom-popup"
                        closeButton={false}
                        offset={[0, -60]}
                        autoPanPadding={[50, 50]}
                    >
                        <div className="w-[320px] bg-card rounded-xl overflow-hidden shadow-2xl border border-neutral-800 font-sans p-0 m-0 cursor-default select-none group">
                            {/* Image Section */}
                            <div className="relative h-44 w-full overflow-hidden">
                                <Image
                                    src={selectedProperty.images[0]}
                                    alt={selectedProperty.name}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                                {/* Favorite Button */}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onLike(selectedProperty.id);
                                    }}
                                    className={cn(
                                        "absolute top-3 left-3 h-8 w-8 rounded-full backdrop-blur-md border flex items-center justify-center transition-all z-20",
                                        isLiked
                                            ? "bg-red-500/20 border-red-500 text-red-500 hover:bg-red-500/30"
                                            : "bg-black/30 border-white/20 text-white hover:bg-black/50"
                                    )}
                                >
                                    <Heart className={cn("h-4 w-4 transition-colors", isLiked ? "fill-current" : "group-hover:scale-110")} />
                                </button>

                                {selectedProperty.isNew && (
                                    <span className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-lg">
                                        New
                                    </span>
                                )}
                            </div>

                            {/* Content Section */}
                            <div className="p-5 bg-card text-white relative -mt-6">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-white leading-tight pr-4">{selectedProperty.name}</h3>
                                    <div className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                        <Star className="h-3 w-3 fill-current" /> 4.8
                                    </div>
                                </div>

                                <p className="text-xs text-neutral-400 mb-6 font-medium tracking-wide">{selectedProperty.address}</p>

                                <div className="flex justify-between items-end border-t border-neutral-800 pt-4 mt-2">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider mb-0.5">Monthly Rent</span>
                                        <span className="font-bold text-2xl text-white tracking-tight">{selectedProperty.price}<span className="text-sm font-normal text-neutral-500 ml-1">/mo</span></span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDetailsClick(selectedProperty);
                                        }}
                                        className="bg-primary hover:bg-primary-dark text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-all shadow-lg shadow-primary/20 active:scale-[0.98] hover:shadow-primary/30"
                                    >
                                        Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Popup>
                )}
            </MapContainer>
            <style jsx global>{`
            .leaflet-container {
                background: #f8fafc;
            }
            .custom-popup .leaflet-popup-content-wrapper {
                background: transparent;
                box-shadow: none;
                padding: 0;
                border-radius: 0;
            }
            .custom-popup .leaflet-popup-content {
                margin: 0 !important;
            }
            .custom-popup .leaflet-popup-tip-container {
                width: 30px;
                height: 15px;
                margin-left: -15px;
                overflow: hidden;
                pointer-events: none;
            }
            .custom-popup .leaflet-popup-tip {
                width: 20px;
                height: 20px;
                padding: 1px;
                
                margin: -10px auto 0;
                transform: rotate(45deg);
                
                background: #0f1218; /* fallback */
                background: var(--card);
                border: 1px solid var(--border); /* border-neutral-800 */
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }
            /* Hide default close button */
            .leaflet-popup-close-button {
                display: none;
            }
            /* Remove marker outline on focus */
            .leaflet-marker-icon:focus {
                outline: none;
            }
        `}</style>
        </div>
    );
}
