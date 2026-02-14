"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Image from "next/image";
import { Star } from "lucide-react";

// Helper to center markers
function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, 14);
    }, [center, map]);
    return null;
}

const createCustomIcon = (price: string, isSelected: boolean) => {
    return L.divIcon({
        className: "custom-marker",
        html: `<div class="${isSelected
            ? "bg-blue-600 text-white z-50 scale-110"
            : "bg-slate-900 text-white border border-slate-700"
            } px-3 py-1 rounded-full text-xs font-bold shadow-xl transition-all transform hover:scale-105 flex items-center justify-center whitespace-nowrap">
      ${price}
    </div>`,
        iconSize: [60, 30],
        iconAnchor: [30, 40],
        popupAnchor: [0, -40],
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
}

export default function SearchMap({
    properties,
    selectedProperty,
    onMarkerClick,
    onDetailsClick
}: SearchMapProps) {

    // Use a stable key to force a fresh map instance on mount/remount
    // preventing "Map container is being reused" errors in dev/strict mode
    const [mapKey] = useState(() => `map-${Date.now()}`);

    useEffect(() => {
        // @ts-ignore
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
    }, []);

    return (
        <div className="h-full w-full relative">
            <MapContainer
                key={mapKey}
                center={[14.6865, 121.0366]}
                zoom={14}
                className="h-full w-full z-0"
                zoomControl={false}
                style={{ background: '#f8fafc', minHeight: '100%' }}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {selectedProperty && (
                    <MapUpdater center={[selectedProperty.lat, selectedProperty.lng]} />
                )}

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
                        <div className="w-[320px] bg-[#0f1218] rounded-xl overflow-hidden shadow-2xl border border-slate-700/50 font-sans p-0 m-0 cursor-default select-none group">
                            {/* Image Section */}
                            <div className="relative h-44 w-full overflow-hidden">
                                <Image
                                    src={selectedProperty.images[0]}
                                    alt={selectedProperty.name}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0f1218] via-transparent to-transparent opacity-60" />

                                {selectedProperty.isNew && (
                                    <span className="absolute top-3 right-3 bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-lg">
                                        New
                                    </span>
                                )}
                            </div>

                            {/* Content Section */}
                            <div className="p-5 bg-[#0f1218] text-white relative -mt-6">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-white leading-tight pr-4">{selectedProperty.name}</h3>
                                    <div className="flex items-center gap-1 text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                                        <Star className="h-3 w-3 fill-current" /> 4.8
                                    </div>
                                </div>

                                <p className="text-xs text-slate-400 mb-6 font-medium tracking-wide">{selectedProperty.address}</p>

                                <div className="flex justify-between items-end border-t border-slate-800 pt-4 mt-2">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-0.5">Monthly Rent</span>
                                        <span className="font-bold text-2xl text-white tracking-tight">{selectedProperty.price}<span className="text-sm font-normal text-slate-500 ml-1">/mo</span></span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDetailsClick(selectedProperty);
                                        }}
                                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] hover:shadow-blue-600/30"
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
                
                background: #0f1218;
                border: 1px solid rgba(51, 65, 85, 0.5); /* slate-700/50 */
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
