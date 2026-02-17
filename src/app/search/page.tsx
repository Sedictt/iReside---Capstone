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
    Shield, Flame, Snowflake, Tv, UtensilsCrossed
} from "lucide-react";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";
import Image from "next/image";

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

// --- Mock Data ---
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
    featured?: boolean;
}

const properties: Property[] = [
    {
        id: "1",
        name: "Skyline Lofts",
        address: "Maysan, Valenzuela",
        price: "₱15,000",
        numericPrice: 15000,
        beds: 2,
        baths: 2,
        sqft: 1150,
        lat: 14.6865,
        lng: 121.0366, // Example coords (Maysan Valenzuela roughly)
        amenities: ["WiFi", "AC"],
        description: "Experience modern urban living in this stunning loft. Featuring floor-to-ceiling windows, polished concrete floors, and a chef's kitchen with smart appliances. Located in the heart of the innovation district.",
        houseRules: ["Pets Allowed", "No Smoking", "No Parties"],
        images: [
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1484154218962-a1c002085d2f?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1595846519845-68e298c2edd8?q=80&w=1000&auto=format&fit=crop"
        ],
        matchScore: 98,
        isNew: true,
        featured: true
    },
    {
        id: "2",
        name: "The Garden Residences",
        address: "Paso de Blas, Valenzuela",
        price: "₱12,500",
        numericPrice: 12500,
        beds: 3,
        baths: 2,
        sqft: 1400,
        lat: 14.6930,
        lng: 121.0450,
        amenities: ["Parking", "Garden"],
        description: "Spacious family home with a private garden.",
        houseRules: ["No Smoking"],
        images: ["https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1000&auto=format&fit=crop"],
        matchScore: 85
    },
    {
        id: "3",
        name: "Metro Studio B",
        address: "Marulas, Valenzuela",
        price: "₱8,500",
        numericPrice: 8500,
        beds: 1,
        baths: 1,
        sqft: 450,
        lat: 14.6750,
        lng: 121.0400,
        amenities: ["Wifi", "Air Con"],
        description: "Perfect for students or young professionals.",
        houseRules: ["No Pets", "No Smoking"],
        images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1000&auto=format&fit=crop"],
        matchScore: 92
    }
];

// --- Property Detail Modal Component ---
function PropertyDetailModal({ property, open, onOpenChange }: { property: Property | null, open: boolean, onOpenChange: (open: boolean) => void }) {
    if (!property) return null;

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
                <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[90vh] w-[95vw] max-w-[1100px] translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-background shadow-2xl focus:outline-none z-[70] overflow-hidden flex border border-neutral-800/50">

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
                                <button className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                                    <Heart className="h-4 w-4" />
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
                    <div className="flex-1 flex flex-col h-full bg-card text-neutral-200 overflow-y-auto custom-scrollbar">

                        {/* Header */}
                        <div className="p-6 md:p-8 space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Dialog.Title className="text-2xl font-bold text-white mb-1">{property.name} Unit 402</Dialog.Title>
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
                                <button className="flex-1 py-2 rounded-md bg-primary text-white text-sm font-bold shadow-sm">Details</button>
                                <button className="flex-1 py-2 rounded-md text-neutral-400 text-sm font-medium hover:text-white transition-colors">Blueprint</button>
                            </div>

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
                                                {amenity.includes("Wifi") && <Wifi className="h-4 w-4" />}
                                                {amenity.includes("Gym") && <Dumbbell className="h-4 w-4" />}
                                                {amenity.includes("Washer") && <WashingMachine className="h-4 w-4" />}
                                                {amenity.includes("Smart") && <Lock className="h-4 w-4" />}
                                                {(!amenity.includes("Wifi") && !amenity.includes("Gym") && !amenity.includes("Washer") && !amenity.includes("Smart")) && <CheckCircle2 className="h-4 w-4" />}
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

                        {/* Footer Actions */}
                        <div className="mt-auto p-6 md:p-8 border-t border-neutral-800 bg-card bg-opacity-95 backdrop-blur-sm sticky bottom-0">
                            <div className="flex gap-3">
                                <button className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20">
                                    <Send className="h-4 w-4" />
                                    Request Tour
                                </button>
                                <button className="h-12 w-12 rounded-xl border border-neutral-700 bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors">
                                    <MessageSquare className="h-5 w-5" />
                                </button>
                            </div>
                            <p className="text-center text-[10px] text-neutral-500 mt-3">Usually responds within 2 hours</p>
                        </div>

                    </div>

                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

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
    const [searchCenter, setSearchCenter] = useState<[number, number]>([14.6865, 121.0366]);
    const [viewCenter, setViewCenter] = useState<[number, number]>([14.6865, 121.0366]);
    const [userLocation, setUserLocation] = useState<[number, number] | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [priceRange, setPriceRange] = useState([3000, 25000]);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

    const amenitiesList = [
        { name: "WiFi", icon: Wifi },
        { name: "Air Con", icon: Snowflake },
        { name: "Parking", icon: Car },
        { name: "Pet Friendly", icon: PawPrint },
        { name: "Laundry", icon: WashingMachine },
        { name: "Gym", icon: Dumbbell },
        { name: "Security", icon: Shield },
        { name: "Kitchen", icon: UtensilsCrossed },
        { name: "Water", icon: Droplets },
        { name: "Cable TV", icon: Tv },
    ];

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
        setShowSuggestions(false);
        setSuggestions([]);
    };

    // Filter properties based on price range
    const filteredProperties = properties.filter(
        (p) => p.numericPrice >= priceRange[0] && p.numericPrice <= priceRange[1]
    );

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
    };

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden font-sans text-neutral-200">

            {/* Sidebar */}
            <aside className="w-[380px] flex-shrink-0 flex flex-col bg-card border-r border-neutral-800 z-20 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 pb-2 flex items-center justify-between border-b border-neutral-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">{showFilters ? "Filters" : "Available Rentals"}</h2>
                        <p className="text-xs text-neutral-400 mt-1">{filteredProperties.length} properties found</p>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-lg border transition-all ${showFilters ? 'bg-primary border-primary text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'}`}
                    >
                        <ListFilter className="h-5 w-5" />
                    </button>
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
                                    {amenitiesList.map((item) => {
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
                            {/* AI Recommendation Card */}
                            <div className="relative p-5 rounded-2xl bg-card border border-neutral-800 shadow-xl">
                                <div className="flex gap-4">
                                    <div className="h-10 w-10 rounded-lg bg-primary text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-white">AI Recommendation</h3>
                                        <p className="text-xs text-neutral-400 leading-relaxed">
                                            Properties in <span className="text-white font-medium">Maysan</span> are seeing 15% lower rates than the city average this month.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Property List */}
                            <div className="space-y-4">
                                {filteredProperties.length === 0 ? (
                                    <div className="text-center py-10 text-neutral-500">
                                        <p>No properties found matching your search.</p>
                                    </div>
                                ) : filteredProperties.map((p) => (
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

            {/* Map Area */}
            <main className="flex-1 relative bg-background">
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
                            // Delay blur to allow clicking on suggestions
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full bg-white/95 backdrop-blur-md border border-neutral-200 rounded-xl py-3 pl-11 pr-12 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-neutral-900 placeholder-neutral-500 font-medium"
                        />
                        <Navigation
                            onClick={handleSearch}
                            className="absolute right-4 top-3.5 h-4 w-4 text-neutral-500 cursor-pointer hover:text-primary hover:scale-110 transition-all z-10"
                        />

                        {/* Search Suggestions Dropdown */}
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

                {/* Top Floating Controls */}
                <div className="absolute top-6 right-6 z-[40] flex items-center gap-3">
                    <div className="bg-card border border-neutral-800 rounded-lg p-1 flex">
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-md shadow-sm">
                            <MapIcon className="h-3 w-3" /> Map
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 text-neutral-400 hover:text-white text-xs font-bold rounded-md transition-colors">
                            <List className="h-3 w-3" /> List
                        </button>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-card border border-neutral-800 flex items-center justify-center overflow-hidden">
                        <Image src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&auto=format&fit=crop" alt="User" width={40} height={40} />
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
                />

                {/* Modal */}
                <PropertyDetailModal
                    property={selectedProperty}
                    open={detailsOpen}
                    onOpenChange={setDetailsOpen}
                />

            </main>

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

        </div>
    );
}
