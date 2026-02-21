"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Slider from "@radix-ui/react-slider";
import {
    Search, ShieldCheck, Map as MapIcon, RotateCw, Plus, Minus, Navigation,
    List, X, Share, Heart, Bed, Bath, LayoutTemplate, Wifi, Dumbbell,
    WashingMachine, Lock, MessageSquare, Send, CheckCircle2, Ban,
    ListFilter, Sparkles, Star, Locate, Car, PawPrint, Droplets,
    Shield, Flame, Snowflake, Tv, UtensilsCrossed, ChevronDown, ChevronUp,
    LayoutGrid, Building, MapPin, SlidersHorizontal, Tag, Calendar, Wind, CircleUser, Clock,
    LayoutDashboard, User, Settings as SettingsIcon, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";
import Image from "next/image";
import Link from "next/link";

// Dynamically import the map component with SSR disabled
const SearchMap = dynamic(
    () => import("@/components/SearchMap"),
    {
        ssr: false,
        loading: () => <div className="h-full w-full bg-background animate-pulse relative">
            <div className="absolute inset-0 flex items-center justify-center text-neutral-500 text-sm">Loading Map...</div>
        </div>
    }
);

import { Property, properties, amenitiesList } from "@/lib/data";
import PropertyCard from "@/components/PropertyCard";
import PropertyDetailModal from "@/components/PropertyDetailModal";

// --- Mock Data ---


// --- Property Detail Modal Component ---


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



export default function SearchPage() {
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [radius, setRadius] = useState([5]);
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<"map" | "list">("map");
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
    const [priceOpen, setPriceOpen] = useState(false);
    const [typeOpen, setTypeOpen] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [searchLocationName, setSearchLocationName] = useState<string>("");

    const [amenitiesOpen, setAmenitiesOpen] = useState(false);
    const [likedProperties, setLikedProperties] = useState<Set<string>>(new Set());
    const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        const savedLikes = localStorage.getItem("likedProperties");
        if (savedLikes) {
            setLikedProperties(new Set(JSON.parse(savedLikes)));
        }

        const savedHistory = localStorage.getItem("recentlyViewed");
        if (savedHistory) {
            setRecentlyViewed(JSON.parse(savedHistory));
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
            // Save to localStorage
            localStorage.setItem("likedProperties", JSON.stringify(Array.from(newLiked)));
            return newLiked;
        });
    };

    // Available Property Types
    const propertyTypes = ["Apartment", "Condo", "House", "Townhouse", "Studio"];

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

    // Debounce search suggestions
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
        // Store the location name for list view text-based filtering
        setSearchLocationName(suggestion.name || suggestion.display_name.split(",")[0].trim());
        setShowSuggestions(false);
        setSuggestions([]);
    };

    // Filter properties based on price range and type
    const filteredProperties = properties.filter((p) => {
        // Filter by Price
        if (p.numericPrice < priceRange[0] || p.numericPrice > priceRange[1]) {
            return false;
        }

        // Filter by Type
        if (selectedTypes.length > 0 && p.type && !selectedTypes.includes(p.type)) {
            return false;
        }

        // Filter by Location
        if (viewMode === "map") {
            // Map view: use radius-based distance from search center
            if (searchCenter) {
                const dist = calculateDistance(searchCenter[0], searchCenter[1], p.lat, p.lng);
                if (dist > radius[0]) {
                    return false;
                }
            }
        } else {
            // List view: use text-based area matching against property address
            if (searchLocationName) {
                const locationLower = searchLocationName.toLowerCase();
                const addressLower = p.address.toLowerCase();
                // Check if the address contains the location name, or any address part matches
                const addressParts = addressLower.split(",").map(s => s.trim());
                const hasMatch = addressLower.includes(locationLower) ||
                    addressParts.some(part => locationLower.includes(part));
                if (!hasMatch) {
                    return false;
                }
            }
        }

        // Filter by Amenities
        if (selectedAmenities.length > 0) {
            const hasAllAmenities = selectedAmenities.every(selected => {
                const selectedLower = selected.toLowerCase();

                // Special handling for "Pet Friendly" which is a house rule, not just an amenity
                if (selectedLower === "pet friendly") {
                    return p.houseRules.some(rule => rule.toLowerCase().includes("pets allowed"));
                }

                // Check in amenities array
                return p.amenities.some(amenity => amenity.toLowerCase() === selectedLower);
            });

            if (!hasAllAmenities) {
                return false;
            }
        }

        return true;
    });

    const handleCurrentLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    // Only update user location and view center, do not change search context
                    setUserLocation([latitude, longitude]);
                    setViewCenter([latitude, longitude]);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    alert("Could not access your location. Please check your browser settings.");
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };

    const handleSearch = async () => {
        if (!searchQuery) return;

        try {
            // Priority 1: Search for a place using Geocoding (OpenStreetMap)
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                setSearchCenter([lat, lon]);
                setViewCenter([lat, lon]);
                setRadius([5]); // Default view radius for a place
                // Store the location name for list view text-based filtering
                setSearchLocationName(data[0].name || data[0].display_name.split(",")[0].trim());
            } else {
                // Fallback: Search in ALL properties for a name match
                const match = properties.find(p =>
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.address.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (match) {
                    setSearchCenter([match.lat, match.lng]);
                    setViewCenter([match.lat, match.lng]);
                    setRadius([2]);
                }
            }
        } catch (error) {
            console.error("Geocoding failed:", error);
            // Fallback on error
            const match = properties.find(p =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.address.toLowerCase().includes(searchQuery.toLowerCase())
            );
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

        // Add to Recently Viewed
        setRecentlyViewed(prev => {
            const newHistory = [property.id, ...prev.filter(id => id !== property.id)].slice(0, 10); // Keep last 10 unique
            localStorage.setItem("recentlyViewed", JSON.stringify(newHistory));
            return newHistory;
        });
    };

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden font-sans text-neutral-200">

            {/* Sidebar - only visible in Map view */}
            {viewMode === "map" && (
                <aside className="w-[380px] flex-shrink-0 flex flex-col bg-card border-r border-neutral-800 z-20 shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="p-6 pb-2 flex items-center justify-between border-b border-neutral-800/50">
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">{showFilters ? "Filters" : "Available Rentals"}</h2>
                            <p className="text-xs text-neutral-400 mt-1">{filteredProperties.length} properties found</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    if (listSortFilter === "saved") {
                                        setListSortFilter("all");
                                    } else {
                                        setListSortFilter("saved");
                                    }
                                }}
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
                                className={`p-2 rounded-lg border transition-all ${showFilters ? 'bg-primary border-primary text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'}`}
                            >
                                <ListFilter className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-4 space-y-6">

                        {showFilters ? (
                            /* Filters View */
                            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                                {/* Header */}
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                                        <MapIcon className="h-5 w-5 text-white" />
                                    </div>
                                    <h1 className="font-bold text-xl text-white tracking-tight">iReside</h1>
                                </div>

                                {/* Title & Stats */}
                                <div className="flex justify-between items-end">
                                    <h2 className="text-2xl font-bold text-white">Find your home</h2>
                                    <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded">{filteredProperties.length} Results</span>
                                </div>



                                {/* Search Radius Slider */}
                                <div className="space-y-4">
                                    <div className="flex justify-between text-xs font-semibold uppercase text-neutral-500 tracking-wider">
                                        <span>Search Radius</span>
                                        <span className="text-primary">{radius} km</span>
                                    </div>
                                    <Slider.Root className="relative flex items-center select-none touch-none w-full h-5" defaultValue={[5]} max={10} step={1} onValueChange={setRadius}>
                                        <Slider.Track className="bg-neutral-800 relative grow rounded-full h-[4px]">
                                            <Slider.Range className="absolute bg-primary rounded-full h-full" />
                                        </Slider.Track>
                                        <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-primary shadow-md rounded-full hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-transform hover:scale-110" aria-label="Volume" />
                                    </Slider.Root>
                                    <div className="flex justify-between text-[10px] text-neutral-600 font-mono">
                                        <span>1km</span>
                                        <span>10km</span>
                                    </div>
                                </div>

                                {/* Price Range */}
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
                                        <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-primary shadow-md rounded-full hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-transform hover:scale-110" aria-label="Minimum price" />
                                        <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-primary shadow-md rounded-full hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-transform hover:scale-110" aria-label="Maximum price" />
                                    </Slider.Root>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 bg-background border border-neutral-800 rounded-lg py-2.5 px-3 flex items-center gap-2">
                                            <span className="text-neutral-500 text-xs">₱</span>
                                            <input
                                                type="number"
                                                className="bg-transparent w-full text-sm text-white focus:outline-none"
                                                placeholder="Min. Amount"
                                                value={priceRange[0]}
                                                onChange={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])}
                                            />
                                        </div>
                                        <div className="text-neutral-600">–</div>
                                        <div className="flex-1 bg-background border border-neutral-800 rounded-lg py-2.5 px-3 flex items-center gap-2">
                                            <span className="text-neutral-500 text-xs">₱</span>
                                            <input
                                                type="number"
                                                className="bg-transparent w-full text-sm text-white focus:outline-none"
                                                placeholder="Max. Amount"
                                                value={priceRange[1]}
                                                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 0])}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Amenities */}
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
                                                        isActive
                                                            ? "bg-primary/10 border-primary/50 text-primary"
                                                            : "bg-background border-neutral-800 text-neutral-400 hover:border-neutral-700"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "h-4 w-4 rounded border flex items-center justify-center flex-shrink-0",
                                                        isActive ? "bg-primary border-primary" : "border-neutral-600"
                                                    )}>
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
                                        {showAllAmenities ? (
                                            <><ChevronUp className="h-3.5 w-3.5" /> See Less</>
                                        ) : (
                                            <><ChevronDown className="h-3.5 w-3.5" /> See More ({amenitiesList.length - 4} more)</>
                                        )}
                                    </button>
                                </div>

                                {/* Property Type */}
                                <div className="space-y-4">
                                    <label className="text-xs font-semibold uppercase text-neutral-500 tracking-wider">Property Type</label>
                                    <div className="flex flex-wrap gap-2">
                                        {["Apartment", "Boarding House", "Dorms"].map((type, i) => (
                                            <button key={i} className={cn(
                                                "px-4 py-1.5 rounded-full text-xs font-medium border transition-colors",
                                                type === "Apartment"
                                                    ? "bg-primary text-white border-primary"
                                                    : "bg-transparent text-neutral-400 border-neutral-700 hover:border-neutral-600 hover:text-neutral-300"
                                            )}>
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleSearch}
                                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl text-sm transition-colors shadow-lg shadow-primary/20 active:scale-[0.98]">
                                    Update Results
                                </button>
                            </div>
                        ) : (
                            /* Results View */
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

                                {/* Property List */}
                                <div className="space-y-4">
                                    {/* Handle saved sorting filter here */}
                                    {(listSortFilter === "saved"
                                        ? filteredProperties.filter(p => likedProperties.has(p.id))
                                        : filteredProperties
                                    ).length === 0 ? (
                                        <div className="text-center py-10 text-neutral-500">
                                            <p>{listSortFilter === "saved" ? "No saved properties found in this area." : "No properties found matching your search."}</p>
                                        </div>
                                    ) : (listSortFilter === "saved"
                                        ? filteredProperties.filter(p => likedProperties.has(p.id))
                                        : filteredProperties
                                    ).map((p) => (
                                        <div
                                            key={p.id}
                                            onClick={() => {
                                                handleMarkerClick(p); // Center map
                                                // Optional: Open details immediately? Image shows "View Details" button.
                                            }}
                                            className={cn(
                                                "group relative bg-background rounded-2xl p-3 flex gap-3 cursor-pointer transition-all hover:bg-card",
                                                p.featured ? "border-2 border-primary shadow-lg shadow-primary/10" : "border border-neutral-800"
                                            )}
                                        >
                                            {/* Image */}
                                            <div className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-neutral-900">
                                                <Image
                                                    src={p.images[0]}
                                                    alt={p.name}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                                {p.featured && (
                                                    <div className="absolute top-2 left-2 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm">
                                                        FEATURED
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 flex flex-col justify-between py-1">
                                                <div>
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h3 className="font-bold text-sm text-white leading-tight">{p.name}</h3>
                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-500">
                                                            <Star className="h-3 w-3 fill-primary text-primary" /> 4.8
                                                        </div>
                                                    </div>
                                                    <p className="text-[10px] text-neutral-500 flex items-center gap-1 mb-2">
                                                        <Navigation className="h-3 w-3" /> {p.address}
                                                    </p>

                                                    {/* Tags (only for featured primarily, or small tags) */}
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
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenDetails(p);
                                                        }}
                                                        className={cn(
                                                            "text-xs font-bold transition-colors",
                                                            p.featured ? "text-primary hover:text-primary-200" : "text-neutral-500 hover:text-white"
                                                        )}
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
            )}

            {/* Map Area */}
            <main className="flex-1 relative bg-background">
                {/* Top Floating Controls */}
                <div className="absolute top-6 right-6 z-[60] flex items-center gap-3">
                    <div className="bg-card border border-neutral-800 rounded-lg p-1 flex shadow-xl">
                        <button
                            onClick={() => setViewMode("map")}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md transition-colors",
                                viewMode === "map" ? "bg-primary text-white shadow-sm" : "text-neutral-400 hover:text-white"
                            )}
                        >
                            <MapIcon className="h-3 w-3" /> Map
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md transition-colors",
                                viewMode === "list" ? "bg-primary text-white shadow-sm" : "text-neutral-400 hover:text-white"
                            )}
                        >
                            <List className="h-3 w-3" /> List
                        </button>
                    </div>

                    {/* User Profile Dropdown */}
                    <div className="relative group">
                        <div className="h-10 w-10 rounded-full bg-card border border-neutral-800 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors shadow-xl">
                            <Image src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&auto=format&fit=crop" alt="User" width={40} height={40} />
                        </div>

                        {/* Dropdown Menu */}
                        <div className="absolute right-0 top-full mt-2 w-48 bg-[#0f172a] border border-neutral-800 rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                            <div className="p-3 border-b border-neutral-800 bg-neutral-900/50">
                                <p className="text-sm font-bold text-white">Jane Cooper</p>
                                <p className="text-[10px] text-neutral-400">Tenant Account</p>
                            </div>
                            <div className="p-1">
                                <Link href="/tenant/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white rounded-lg transition-colors">
                                    <LayoutDashboard className="h-4 w-4 text-neutral-500" />
                                    Dashboard
                                </Link>
                                <Link href="/tenant/profile" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white rounded-lg transition-colors text-left">
                                    <User className="h-4 w-4 text-neutral-500" />
                                    Profile
                                </Link>
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white rounded-lg transition-colors text-left">
                                    <SettingsIcon className="h-4 w-4 text-neutral-500" />
                                    Settings
                                </button>
                            </div>
                            <div className="p-1 border-t border-neutral-800">
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors text-left">
                                    <LogOut className="h-4 w-4" />
                                    Log Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {viewMode === "map" ? (
                    <div key="map-view" className="animate-view-map h-full w-full absolute inset-0">
                        {/* Search Bar - Top Center */}
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
                                <Navigation
                                    onClick={handleSearch}
                                    className="absolute right-4 top-3.5 h-4 w-4 text-neutral-500 cursor-pointer hover:text-primary hover:scale-110 transition-all z-10"
                                />

                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-neutral-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                        {suggestions.map((item, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleSuggestionClick(item)}
                                                className="w-full text-left px-4 py-3 text-xs text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors border-b border-neutral-100 last:border-0 flex items-center gap-2"
                                            >
                                                <MapIcon className="h-3 w-3 flex-shrink-0 text-primary" />
                                                <span className="truncate">{item.display_name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>



                        {/* Bottom Floating Controls */}
                        <div className="absolute bottom-6 right-6 z-[40] flex flex-col gap-2">
                            <button className="h-10 w-10 rounded-lg bg-card border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-600 flex items-center justify-center transition-colors shadow-xl">
                                <Plus className="h-5 w-5" />
                            </button>
                            <button className="h-10 w-10 rounded-lg bg-card border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-600 flex items-center justify-center transition-colors shadow-xl">
                                <Minus className="h-5 w-5" />
                            </button>
                            <button
                                onClick={handleCurrentLocation}
                                className="mt-2 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary-dark transition-colors"
                                title="My Location"
                            >
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
                    </div>
                ) : (
                    /* ===== LIST VIEW ===== */
                    <div key="list-view" className="h-full overflow-y-auto custom-scrollbar bg-background animate-view-list">

                        {/* Hero Banner */}
                        <div className="relative h-[380px] w-full">
                            <Image
                                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1920&auto=format&fit=crop"
                                alt="Find your perfect place"
                                fill
                                className="object-cover"
                                priority
                            />
                            <div className="absolute inset-0 bg-black/30" />

                            {/* Hero Text */}
                            <div className="absolute inset-0 flex flex-col justify-center px-12">
                                <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight max-w-lg">
                                    Find your perfect<br />place to stay
                                </h1>
                            </div>

                            {/* Inline Search Bar */}
                            <div className="absolute bottom-[-32px] left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-[1000px]">
                                <div className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/30 p-2 flex items-center gap-0">
                                    {/* Location */}
                                    <div className="flex-1 flex items-center gap-3 px-5 py-3 border-r border-neutral-700">
                                        <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                                        <div className="w-full">
                                            <p className="text-xs font-semibold text-white">Location</p>
                                            <input
                                                type="text"
                                                placeholder="Search directions"
                                                value={searchQuery}
                                                onChange={(e) => {
                                                    setSearchQuery(e.target.value);
                                                    setShowSuggestions(true);
                                                }}
                                                onFocus={() => setShowSuggestions(true)}
                                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                className="bg-transparent text-xs text-neutral-400 placeholder-neutral-500 focus:outline-none w-full mt-0.5"
                                            />
                                        </div>
                                    </div>

                                    {/* Price Range */}
                                    <div className="flex-1 relative border-r border-neutral-700">
                                        <button
                                            onClick={() => {
                                                setPriceOpen(!priceOpen);
                                                setTypeOpen(false);
                                                setAmenitiesOpen(false);
                                                setShowSuggestions(false);
                                            }}
                                            className={cn(
                                                "w-full h-full flex items-center gap-3 px-5 py-3 transition-colors",
                                                priceOpen ? "bg-neutral-800/50" : "hover:bg-neutral-800/30"
                                            )}
                                        >
                                            <Tag className="h-4 w-4 text-primary flex-shrink-0" />
                                            <div className="text-left">
                                                <p className="text-xs font-semibold text-white">Price range</p>
                                                <p className="text-xs text-neutral-400 mt-0.5">₱{priceRange[0].toLocaleString()} – ₱{priceRange[1].toLocaleString()}</p>
                                            </div>
                                        </button>

                                        {/* Dropdown */}
                                        {priceOpen && (
                                            <div className="absolute top-full left-0 mt-3 w-[320px] bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-5 z-[60] animate-in fade-in zoom-in-95 duration-200">
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="text-sm font-bold text-white">Price Range</span>
                                                    <span className="text-xs text-neutral-400">Monthly Rent</span>
                                                </div>

                                                {/* Slider */}
                                                <Slider.Root
                                                    className="relative flex items-center select-none touch-none w-full h-5 mb-6"
                                                    value={priceRange}
                                                    max={50000}
                                                    step={500}
                                                    minStepsBetweenThumbs={1}
                                                    onValueChange={setPriceRange}
                                                >
                                                    <Slider.Track className="bg-neutral-800 relative grow rounded-full h-[3px]">
                                                        <Slider.Range className="absolute bg-primary rounded-full h-full" />
                                                    </Slider.Track>
                                                    <Slider.Thumb
                                                        className="block w-4 h-4 bg-white border-2 border-primary shadow-lg rounded-full hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-transform hover:scale-110"
                                                        aria-label="Min price"
                                                    />
                                                    <Slider.Thumb
                                                        className="block w-4 h-4 bg-white border-2 border-primary shadow-lg rounded-full hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-transform hover:scale-110"
                                                        aria-label="Max price"
                                                    />
                                                </Slider.Root>

                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2">
                                                        <span className="text-[10px] text-neutral-500 block mb-0.5">Min</span>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs text-neutral-400">₱</span>
                                                            <input
                                                                type="number"
                                                                value={priceRange[0]}
                                                                onChange={(e) => setPriceRange([Math.min(Number(e.target.value), priceRange[1]), priceRange[1]])}
                                                                className="w-full bg-transparent text-sm font-bold text-white focus:outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="w-2 h-[2px] bg-neutral-800" />
                                                    <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2">
                                                        <span className="text-[10px] text-neutral-500 block mb-0.5">Max</span>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs text-neutral-400">₱</span>
                                                            <input
                                                                type="number"
                                                                value={priceRange[1]}
                                                                onChange={(e) => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0])])}
                                                                className="w-full bg-transparent text-sm font-bold text-white focus:outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Amenities Filter */}
                                    <div className="flex-1 relative border-r border-neutral-700">
                                        <button
                                            onClick={() => {
                                                setAmenitiesOpen(!amenitiesOpen);
                                                setPriceOpen(false);
                                                setTypeOpen(false);
                                                setShowSuggestions(false);
                                            }}
                                            className={cn(
                                                "w-full h-full flex items-center gap-3 px-5 py-3 transition-colors",
                                                amenitiesOpen ? "bg-neutral-800/50" : "hover:bg-neutral-800/30"
                                            )}
                                        >
                                            <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                                            <div className="text-left">
                                                <p className="text-xs font-semibold text-white">Amenities</p>
                                                <p className="text-xs text-neutral-400 mt-0.5 truncate max-w-[120px]">
                                                    {selectedAmenities.length === 0
                                                        ? "All amenities"
                                                        : selectedAmenities.length === 1
                                                            ? selectedAmenities[0]
                                                            : `${selectedAmenities.length} selected`}
                                                </p>
                                            </div>
                                        </button>

                                        {/* Dropdown */}
                                        {amenitiesOpen && (
                                            <div className="absolute top-full left-0 mt-3 w-[280px] bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-2 z-[60] animate-in fade-in zoom-in-95 duration-200">
                                                <div className="max-h-[240px] overflow-y-auto custom-scrollbar space-y-1">
                                                    {amenitiesList.map((item) => (
                                                        <button
                                                            key={item.name}
                                                            onClick={() => toggleAmenity(item.name)}
                                                            className={cn(
                                                                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                                                                selectedAmenities.includes(item.name)
                                                                    ? "bg-primary/20 text-white"
                                                                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className={cn(
                                                                    "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                                                                    selectedAmenities.includes(item.name)
                                                                        ? "bg-primary border-primary"
                                                                        : "border-neutral-600 group-hover:border-neutral-400"
                                                                )}>
                                                                    {selectedAmenities.includes(item.name) && <CheckCircle2 className="h-3 w-3 text-white" />}
                                                                </div>
                                                                {item.name}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="mt-2 pt-2 border-t border-neutral-800 flex justify-end">
                                                    <button
                                                        onClick={() => setSelectedAmenities([])}
                                                        className="text-[10px] text-neutral-500 hover:text-white px-2 py-1 transition-colors"
                                                    >
                                                        Clear All
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Property Type */}
                                    {/* Property Type */}
                                    <div className="flex-1 relative">
                                        <button
                                            onClick={() => {
                                                setTypeOpen(!typeOpen);
                                                setPriceOpen(false);
                                                setAmenitiesOpen(false);
                                                setShowSuggestions(false);
                                            }}
                                            className={cn(
                                                "w-full h-full flex items-center gap-3 px-5 py-3 transition-colors",
                                                typeOpen ? "bg-neutral-800/50" : "hover:bg-neutral-800/30"
                                            )}
                                        >
                                            <Building className="h-4 w-4 text-primary flex-shrink-0" />
                                            <div className="text-left">
                                                <p className="text-xs font-semibold text-white">Property type</p>
                                                <p className="text-xs text-neutral-400 mt-0.5 truncate max-w-[120px]">
                                                    {selectedTypes.length === 0
                                                        ? "Select type"
                                                        : selectedTypes.length === 1
                                                            ? selectedTypes[0]
                                                            : `${selectedTypes.length} selected`}
                                                </p>
                                            </div>
                                        </button>

                                        {/* Dropdown */}
                                        {typeOpen && (
                                            <div className="absolute top-full left-0 mt-3 w-[260px] bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-2 z-[60] animate-in fade-in zoom-in-95 duration-200">
                                                <div className="space-y-1">
                                                    {propertyTypes.map((type) => (
                                                        <button
                                                            key={type}
                                                            onClick={() => handleTypeToggle(type)}
                                                            className={cn(
                                                                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                                                                selectedTypes.includes(type)
                                                                    ? "bg-primary/20 text-white"
                                                                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className={cn(
                                                                    "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                                                                    selectedTypes.includes(type)
                                                                        ? "bg-primary border-primary"
                                                                        : "border-neutral-600 group-hover:border-neutral-400"
                                                                )}>
                                                                    {selectedTypes.includes(type) && <CheckCircle2 className="h-3 w-3 text-white" />}
                                                                </div>
                                                                {type}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="mt-2 pt-2 border-t border-neutral-800 flex justify-end">
                                                    <button
                                                        onClick={() => setSelectedTypes([])}
                                                        className="text-[10px] text-neutral-500 hover:text-white px-2 py-1 transition-colors"
                                                    >
                                                        Clear All
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Search Button */}
                                    {/* Backdrop for closing dropdowns */}
                                    {(priceOpen || typeOpen || amenitiesOpen) && (
                                        <div
                                            className="fixed inset-0 z-[50] bg-transparent"
                                            onClick={() => {
                                                setPriceOpen(false);
                                                setTypeOpen(false);
                                                setAmenitiesOpen(false);
                                            }}
                                        />
                                    )}

                                    <button
                                        onClick={handleSearch}
                                        className="bg-primary hover:bg-primary-dark text-white rounded-xl px-6 py-3.5 flex items-center gap-2 font-bold text-sm transition-colors shadow-lg shadow-primary/25 flex-shrink-0 z-[60]"
                                    >
                                        <Search className="h-4 w-4" /> Search
                                    </button>
                                </div>

                                {/* Search Suggestions under hero bar */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="mt-2 bg-card border border-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden">
                                        {suggestions.map((item, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleSuggestionClick(item)}
                                                className="w-full text-left px-4 py-3 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors border-b border-neutral-800 last:border-0 flex items-center gap-2"
                                            >
                                                <MapPin className="h-3 w-3 flex-shrink-0 text-primary" />
                                                <span className="truncate">{item.display_name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Filter Bar + View Toggle */}
                        <div className="pt-14 px-8 pb-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {[
                                    { label: "View Details", icon: SlidersHorizontal, value: "all" },
                                    { label: "New first", icon: Sparkles, value: "new" },
                                    { label: "Featured", icon: Star, value: "featured" },
                                    { label: "Recently Viewed", icon: Clock, value: "recent" },
                                ].map((filter) => {
                                    const Icon = filter.icon;
                                    const isActive = listSortFilter === filter.value;

                                    // Don't show "Recently Viewed" if empty
                                    if (filter.value === "recent" && recentlyViewed.length === 0) return null;

                                    return (
                                        <button
                                            key={filter.value}
                                            onClick={() => setListSortFilter(filter.value)}
                                            className={cn(
                                                "flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition-all border",
                                                isActive
                                                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                                                    : "bg-card text-neutral-400 border-neutral-800 hover:border-neutral-600 hover:text-white"
                                            )}
                                        >
                                            <Icon className={cn("h-3.5 w-3.5", filter.value === "recent" && isActive && "animate-pulse")} />
                                            {filter.label}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => {
                                        if (listSortFilter === "saved") {
                                            setListSortFilter("all");
                                        } else {
                                            setListSortFilter("saved");
                                        }
                                    }}
                                    className={cn(
                                        "flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition-all border group",
                                        listSortFilter === "saved"
                                            ? "bg-red-500/10 border-red-500 text-red-500 shadow-md shadow-red-500/20"
                                            : "bg-card text-neutral-400 border-neutral-800 hover:border-neutral-600 hover:text-white"
                                    )}
                                >
                                    <Heart className={cn(
                                        "h-3.5 w-3.5 transition-colors",
                                        listSortFilter === "saved" ? "fill-red-500 text-red-500" : "group-hover:text-red-500"
                                    )} />
                                    Saved
                                    {likedProperties.size > 0 && listSortFilter !== "saved" && (
                                        <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                            {likedProperties.size}
                                        </span>
                                    )}
                                </button>
                            </div>


                        </div>

                        {/* Results Section */}
                        <div className="px-8 pb-12">
                            <h2 className="text-2xl font-bold text-white mb-6">
                                Top picks for you
                            </h2>

                            {filteredProperties.length === 0 ? (
                                <div className="flex flex-col gap-12">
                                    <div className="flex flex-col items-center justify-center py-10 text-neutral-400">
                                        <Search className="h-12 w-12 mb-4 text-neutral-700" />
                                        <p className="text-lg font-medium text-neutral-300">No properties found in this area</p>
                                        <p className="text-sm mt-1 text-neutral-500">We couldn't find any matches within {radius[0]}km. Try expanding your search radius.</p>
                                    </div>

                                    {/* Recommendations */}
                                    <div className="space-y-6">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                            <Sparkles className="h-5 w-5 text-primary" />
                                            You might like
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                                            {properties.slice(0, 4).map((p) => (
                                                <PropertyCard
                                                    key={p.id}
                                                    property={p}
                                                    isLiked={likedProperties.has(p.id)}
                                                    onLike={toggleLike}
                                                    onClick={handleOpenDetails}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                                    {(listSortFilter === "new"
                                        ? [...filteredProperties].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
                                        : listSortFilter === "featured"
                                            ? [...filteredProperties].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
                                            : listSortFilter === "recent"
                                                ? recentlyViewed
                                                    .map(id => properties.find(p => p.id === id))
                                                    .filter((p): p is Property => p !== undefined)
                                                : listSortFilter === "saved"
                                                    ? [...filteredProperties].filter(p => likedProperties.has(p.id))
                                                    : filteredProperties
                                    ).map((p) => (
                                        <PropertyCard
                                            key={p.id}
                                            property={p}
                                            isLiked={likedProperties.has(p.id)}
                                            onLike={toggleLike}
                                            onClick={handleOpenDetails}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )
                }

                {/* Modal */}
                <PropertyDetailModal
                    property={selectedProperty}
                    isLiked={selectedProperty ? likedProperties.has(selectedProperty.id) : false}
                    onLike={toggleLike}
                    open={detailsOpen}
                    onOpenChange={setDetailsOpen}
                />

            </main >

            <style jsx global>{`
        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0a0a0a; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #404040; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569; 
        }
      `}</style>
        </div >
    );
}
