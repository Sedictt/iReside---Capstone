"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import * as Slider from "@radix-ui/react-slider";
import {
    MapPin, Search, SlidersHorizontal, Plus, Minus, Locate, Heart, Star, Navigation, Building, Tag, Sparkles, Clock, CheckCircle2, ChevronUp, ChevronDown, ListFilter
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Dynamically import the map component with SSR disabled
const SearchMap = dynamic(
    () => import("@/components/SearchMap"),
    { ssr: false }
);

import { Property, properties, amenitiesList } from "@/lib/data";
import PropertyCard from "@/components/PropertyCard";
import PropertyDetailModal from "@/components/PropertyDetailModal";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

export default function SearchMapView() {
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [radius, setRadius] = useState([5]);
    const [showFilters, setShowFilters] = useState(false);
    const [searchCenter, setSearchCenter] = useState<[number, number]>([14.6865, 121.0366]);
    const [viewCenter, setViewCenter] = useState<[number, number]>([14.6865, 121.0366]);
    const [userLocation, setUserLocation] = useState<[number, number] | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [priceRange, setPriceRange] = useState([3000, 25000]);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [showAllAmenities, setShowAllAmenities] = useState(false);
    const [listSortFilter, setListSortFilter] = useState("all");
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [searchLocationName, setSearchLocationName] = useState<string>("");

    const [likedProperties, setLikedProperties] = useState<Set<string>>(new Set());
    const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

    useEffect(() => {
        const savedLikes = localStorage.getItem("likedProperties");
        if (savedLikes) {
            setLikedProperties(new Set(JSON.parse(savedLikes)));
        }

        const savedHistory = localStorage.getItem("recentlyViewed");
        if (savedHistory) {
            setRecentlyViewed(JSON.parse(savedHistory));
        }

        // Get initial location
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation([latitude, longitude]);
                    setViewCenter([latitude, longitude]);
                    setSearchCenter([latitude, longitude]);
                },
                () => { }
            );
        }
    }, []);

    const toggleLike = (id: string) => {
        setLikedProperties(prev => {
            const newLiked = new Set(prev);
            if (newLiked.has(id)) {
                newLiked.delete(id);
            } else {
                newLiked.add(id);
            }
            localStorage.setItem("likedProperties", JSON.stringify(Array.from(newLiked)));
            return newLiked;
        });
    };

    const propertyTypes = ["Dormitories", "Boarding Houses", "Apartments"];

    const handleTypeToggle = (type: string) => {
        setSelectedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const toggleAmenity = (name: string) => {
        setSelectedAmenities((prev) =>
            prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
        );
    };

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (searchQuery.length < 3) {
                setSuggestions([]);
                return;
            }

            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=5`);
                const data = await response.json();
                setSuggestions(data);
            } catch (error) {
                console.error("Error fetching suggestions:", error);
            }
        };

        const timeoutId = setTimeout(() => {
            if (showSuggestions) {
                fetchSuggestions();
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, showSuggestions]);

    const handleSuggestionClick = (suggestion: any) => {
        setSearchQuery(suggestion.display_name);
        const lat = parseFloat(suggestion.lat);
        const lon = parseFloat(suggestion.lon);
        setSearchCenter([lat, lon]);
        setViewCenter([lat, lon]);
        setRadius([5]);
        setSearchLocationName(suggestion.name || suggestion.display_name.split(",")[0].trim());
        setShowSuggestions(false);
        setSuggestions([]);
    };

    const filteredProperties = properties.filter((p) => {
        if (p.numericPrice < priceRange[0] || p.numericPrice > priceRange[1]) return false;
        if (selectedTypes.length > 0 && p.type && !selectedTypes.includes(p.type)) return false;

        if (searchCenter) {
            const dist = calculateDistance(searchCenter[0], searchCenter[1], p.lat, p.lng);
            if (dist > radius[0]) return false;
        }

        if (selectedAmenities.length > 0) {
            const hasAllAmenities = selectedAmenities.every(selected => {
                const selectedLower = selected.toLowerCase();
                if (selectedLower === "pet friendly") {
                    return p.houseRules.some(rule => rule.toLowerCase().includes("pets allowed"));
                }
                return p.amenities.some(amenity => amenity.toLowerCase() === selectedLower);
            });
            if (!hasAllAmenities) return false;
        }

        return true;
    });

    const handleCurrentLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation([latitude, longitude]);
                    setViewCenter([latitude, longitude]);
                },
                () => alert("Could not access your location. Please check your browser settings.")
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };

    const handleSearch = async () => {
        if (!searchQuery) return;
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                setSearchCenter([lat, lon]);
                setViewCenter([lat, lon]);
                setRadius([5]);
                setSearchLocationName(data[0].name || data[0].display_name.split(",")[0].trim());
            } else {
                const match = properties.find(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.address.toLowerCase().includes(searchQuery.toLowerCase()));
                if (match) {
                    setSearchCenter([match.lat, match.lng]);
                    setViewCenter([match.lat, match.lng]);
                    setRadius([2]);
                }
            }
        } catch (error) {
            const match = properties.find(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.address.toLowerCase().includes(searchQuery.toLowerCase()));
            if (match) {
                setSearchCenter([match.lat, match.lng]);
                setViewCenter([match.lat, match.lng]);
                setRadius([2]);
            }
        }
    };

    const handleMarkerClick = (property: Property) => {
        setSelectedProperty(property);
        setViewCenter([property.lat, property.lng]);
    };

    const handleOpenDetails = (property: Property) => {
        setSelectedProperty(property);
        setDetailsOpen(true);
        setRecentlyViewed(prev => {
            const newHistory = [property.id, ...prev.filter(id => id !== property.id)].slice(0, 10);
            localStorage.setItem("recentlyViewed", JSON.stringify(newHistory));
            return newHistory;
        });
    };

    return (
        <div className="flex flex-1 overflow-hidden relative w-full h-full text-neutral-200">
            {/* Sidebar */}
            <aside className="w-full md:w-[380px] flex-shrink-0 flex flex-col bg-card border-r border-neutral-800 z-20 shadow-2xl overflow-hidden">
                <div className="p-6 pb-2 flex items-center justify-between border-b border-neutral-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">{showFilters ? "Filters" : "Available Rentals"}</h2>
                        <p className="text-xs text-neutral-400 mt-1">{filteredProperties.length} properties found</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setListSortFilter(prev => prev === "saved" ? "all" : "saved")}
                            className={cn(
                                "p-2 rounded-lg border relative group transition-colors",
                                listSortFilter === "saved"
                                    ? "bg-red-500/10 border-red-500 text-red-500"
                                    : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-600"
                            )}>
                            <Heart className={cn(
                                "h-5 w-5 transition-colors",
                                listSortFilter === "saved" ? "fill-red-500 text-red-500" : "group-hover:text-red-500"
                            )} />
                            {likedProperties.size > 0 && listSortFilter !== "saved" && (
                                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border border-neutral-900" />
                            )}
                        </button>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn("p-2 rounded-lg border transition-all", showFilters ? 'bg-primary border-primary text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white')}
                        >
                            <ListFilter className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-4 space-y-6">
                    {showFilters ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-bold text-white">Find your home</h2>
                                <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded">{filteredProperties.length} Results</span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between text-xs font-semibold uppercase text-neutral-500 tracking-wider">
                                    <span>Search Radius</span>
                                    <span className="text-primary">{radius} km</span>
                                </div>
                                <Slider.Root className="relative flex items-center select-none touch-none w-full h-5" value={radius} max={10} min={1} step={1} onValueChange={setRadius}>
                                    <Slider.Track className="bg-neutral-800 relative grow rounded-full h-[4px]">
                                        <Slider.Range className="absolute bg-primary rounded-full h-full" />
                                    </Slider.Track>
                                    <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-primary shadow-md rounded-full hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-transform" />
                                </Slider.Root>
                                <div className="flex justify-between text-[10px] text-neutral-600 font-mono">
                                    <span>1km</span>
                                    <span>10km</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between text-xs font-semibold uppercase text-neutral-500 tracking-wider">
                                    <span>Price Range</span>
                                    <span className="text-primary">₱{priceRange[0].toLocaleString()} – ₱{priceRange[1].toLocaleString()}</span>
                                </div>
                                <Slider.Root
                                    className="relative flex items-center select-none touch-none w-full h-5"
                                    value={priceRange}
                                    min={1000}
                                    max={50000}
                                    step={500}
                                    onValueChange={setPriceRange}
                                >
                                    <Slider.Track className="bg-neutral-800 relative grow rounded-full h-[4px]">
                                        <Slider.Range className="absolute bg-primary rounded-full h-full" />
                                    </Slider.Track>
                                    <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-primary shadow-md rounded-full focus:outline-none" />
                                    <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-primary shadow-md rounded-full focus:outline-none" />
                                </Slider.Root>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-background border border-neutral-800 rounded-lg py-2.5 px-3 flex flex-col justify-center">
                                        <span className="text-[10px] text-neutral-500 font-mono block mb-1">Min</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-neutral-500 text-xs">₱</span>
                                            <input
                                                type="number"
                                                className="bg-transparent w-full text-sm text-white focus:outline-none"
                                                value={priceRange[0]}
                                                onChange={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])}
                                            />
                                        </div>
                                    </div>
                                    <div className="text-neutral-600">–</div>
                                    <div className="flex-1 bg-background border border-neutral-800 rounded-lg py-2.5 px-3 flex flex-col justify-center">
                                        <span className="text-[10px] text-neutral-500 font-mono block mb-1">Max</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-neutral-500 text-xs">₱</span>
                                            <input
                                                type="number"
                                                className="bg-transparent w-full text-sm text-white focus:outline-none"
                                                value={priceRange[1]}
                                                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 0])}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-semibold uppercase text-neutral-500 tracking-wider">Amenities</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {(showAllAmenities ? amenitiesList : amenitiesList.slice(0, 4)).map((item) => {
                                        const isActive = selectedAmenities.includes(item.name);
                                        const Icon = item.icon;
                                        return (
                                            <div
                                                key={item.name}
                                                onClick={() => toggleAmenity(item.name)}
                                                className={cn(
                                                    "flex items-center gap-2.5 p-3 rounded-lg border text-xs font-medium cursor-pointer transition-all",
                                                    isActive ? "bg-primary/10 border-primary/50 text-primary" : "bg-background border-neutral-800 text-neutral-400 hover:border-neutral-700"
                                                )}
                                            >
                                                <div className={cn("h-4 w-4 rounded border flex items-center justify-center flex-shrink-0", isActive ? "bg-primary border-primary" : "border-neutral-600")}>
                                                    {isActive && <span className="text-white text-[8px]">✓</span>}
                                                </div>
                                                <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                                                {item.name}
                                            </div>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => setShowAllAmenities(!showAllAmenities)}
                                    className="flex items-center justify-center gap-1.5 w-full text-xs text-neutral-500 hover:text-primary font-medium py-1.5 transition-colors"
                                >
                                    {showAllAmenities ? <><ChevronUp className="h-3.5 w-3.5" /> See Less</> : <><ChevronDown className="h-3.5 w-3.5" /> See More</>}
                                </button>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-semibold uppercase text-neutral-500 tracking-wider">Property Type</label>
                                <div className="flex flex-wrap gap-2">
                                    {propertyTypes.map((type, i) => (
                                        <button key={i} onClick={() => handleTypeToggle(type)} className={cn(
                                            "px-4 py-1.5 rounded-full text-xs font-medium border transition-colors",
                                            selectedTypes.includes(type) ? "bg-primary text-white border-primary" : "bg-transparent text-neutral-400 border-neutral-700 hover:border-neutral-600"
                                        )}>
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-4">
                                {(listSortFilter === "saved" ? filteredProperties.filter(p => likedProperties.has(p.id)) : filteredProperties).length === 0 ? (
                                    <div className="text-center py-10 text-neutral-500">
                                        <p>{listSortFilter === "saved" ? "No saved properties found." : "No properties found."}</p>
                                    </div>
                                ) : (listSortFilter === "saved" ? filteredProperties.filter(p => likedProperties.has(p.id)) : filteredProperties).map((p) => (
                                    <div
                                        key={p.id}
                                        onClick={() => handleMarkerClick(p)}
                                        className={cn(
                                            "group relative bg-background rounded-2xl p-3 flex gap-3 cursor-pointer transition-all hover:bg-card",
                                            p.featured ? "border-2 border-primary shadow-lg shadow-primary/10" : "border border-neutral-800"
                                        )}
                                    >
                                        <div className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-neutral-900">
                                            <Image src={p.images[0]} alt={p.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                                            {p.featured && (
                                                <div className="absolute top-2 left-2 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm">FEATURED</div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between py-1">
                                            <div>
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="font-bold text-sm text-white leading-tight break-words pr-2">{p.name}</h3>
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-500 shrink-0">
                                                        <Star className="h-3 w-3 fill-primary text-primary" /> 4.8
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-neutral-500 flex items-center gap-1 mb-2">
                                                    <Navigation className="h-3 w-3 shrink-0" /> <span className="truncate">{p.address}</span>
                                                </p>
                                                {p.featured && (
                                                    <div className="flex gap-1.5 mb-2">
                                                        <span className="text-[9px] border border-neutral-700 text-neutral-400 px-1.5 py-0.5 rounded uppercase">WiFi</span>
                                                        <span className="text-[9px] border border-neutral-700 text-neutral-400 px-1.5 py-0.5 rounded uppercase">AC</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="font-bold text-lg text-white">{p.price}<span className="text-[10px] font-normal text-neutral-500">/mo</span></span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleOpenDetails(p); }}
                                                    className={cn("text-xs font-bold transition-colors", p.featured ? "text-primary hover:text-primary-200" : "text-neutral-500 hover:text-white")}
                                                >
                                                    {p.featured ? "View Details" : "Details"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Map Area */}
            <main className="flex-1 relative bg-background">
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[50] w-[600px] max-w-[90%]">
                    <div className="relative group shadow-xl shadow-black/10 rounded-xl">
                        <Search className="absolute left-4 top-3.5 h-4 w-4 text-neutral-500 group-focus-within:text-primary transition-colors z-10" />
                        <input
                            type="text"
                            placeholder="Search by city, neighborhood, or address..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full bg-white/95 backdrop-blur-md border border-neutral-200 rounded-xl py-3 pl-11 pr-12 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-neutral-900 placeholder-neutral-500 font-medium"
                        />
                        <Navigation onClick={handleSearch} className="absolute right-4 top-3.5 h-4 w-4 text-neutral-500 cursor-pointer hover:text-primary transition-all z-10" />
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-neutral-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                {suggestions.map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSuggestionClick(item)}
                                        className="w-full text-left px-4 py-3 text-xs text-neutral-600 hover:bg-neutral-100 transition-colors border-b border-neutral-100 last:border-0 flex items-center gap-2"
                                    >
                                        <MapPin className="h-3 w-3 flex-shrink-0 text-primary" />
                                        <span className="truncate">{item.display_name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Floating Controls */}
                <div className="absolute bottom-6 right-6 z-[40] flex flex-col gap-2">
                    <button className="h-10 w-10 rounded-lg bg-card border border-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center shadow-xl">
                        <Plus className="h-5 w-5" />
                    </button>
                    <button className="h-10 w-10 rounded-lg bg-card border border-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center shadow-xl">
                        <Minus className="h-5 w-5" />
                    </button>
                    <button onClick={handleCurrentLocation} className="mt-2 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30">
                        <Locate className="h-4 w-4" />
                    </button>
                </div>

                <SearchMap
                    properties={filteredProperties}
                    selectedProperty={selectedProperty}
                    onMarkerClick={handleMarkerClick}
                    onDetailsClick={handleOpenDetails}
                    radius={radius[0]}
                    center={searchCenter}
                    viewCenter={viewCenter}
                    location={userLocation}
                    likedProperties={likedProperties}
                    onLike={toggleLike}
                />
            </main>

            <PropertyDetailModal
                property={selectedProperty}
                isLiked={selectedProperty ? likedProperties.has(selectedProperty.id) : false}
                onLike={toggleLike}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
            />

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #0a0a0a; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #404040; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
            `}</style>
        </div>
    );
}
