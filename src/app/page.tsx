"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Slider from "@radix-ui/react-slider";
import {
  List,
  Building2,
  House,
  Wallet,
  Zap,
  MapPin,
  Users,
  Globe,
  Menu,
  X,
  Search,
  Flame,
  Star,
  ChevronRight,
  TrendingUp,
  Map as MapIcon,
  Sparkles,
  ChevronDown,
  CalendarDays,
  Smartphone,
  Mail,
  QrCode,
  Check,
  CheckSquare
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useProperties, FeedProperty } from "@/hooks/useProperties";
import PropertyCard from "@/components/PropertyCard";
import PropertyDetailModal from "@/components/PropertyDetailModal";
import { cn } from "@/lib/utils";
import SearchMapView from "@/components/SearchMapView";
import { useAuth } from "@/hooks/useAuth";
import { AuthProvider } from '@/context/AuthContext';
import { TenantNavbar } from "@/components/tenant/TenantNavbar";
import { useRouter } from "next/navigation";

function LandingPageContent() {
  const { profile, user, loading } = useAuth();
  const role = profile?.role || (user?.user_metadata?.role as string) || (user ? 'tenant' : null);
  const router = useRouter();
  const { properties: dbProperties, loading: propsLoading } = useProperties();

  useEffect(() => {
    if (!loading && role === 'landlord') {
      router.push('/landlord/dashboard');
    }
  }, [loading, role, router]);

  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All Rentals");
  const [isLiked, setIsLiked] = useState<Record<string, boolean>>({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [location, setLocation] = useState("");
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([3000, 25000]);

  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("Apartments");
  const typeOptions = ["Any", "Apartments", "Boarding Houses", "Dormitories"];

  const [isAmenitiesOpen, setIsAmenitiesOpen] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const amenitiesOptions = ["Wi-Fi", "Air Conditioning", "Parking", "Pool", "Pet Friendly", "Gym"];

  const budgetRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);
  const amenitiesRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (budgetRef.current && !budgetRef.current.contains(event.target as Node)) {
        setIsBudgetOpen(false);
      }
      if (typeRef.current && !typeRef.current.contains(event.target as Node)) {
        setIsTypeOpen(false);
      }
      if (amenitiesRef.current && !amenitiesRef.current.contains(event.target as Node)) {
        setIsAmenitiesOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchSuggestions(false);
        setActiveSuggestionIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [trendingProps, setTrendingProps] = useState<FeedProperty[]>([]);

  // Set default trending when DB data loads
  useEffect(() => {
    if (dbProperties.length > 0 && trendingProps.length === 0) {
      setTrendingProps(dbProperties.slice(0, 3));
    }
  }, [dbProperties]);

  useEffect(() => {
    if (dbProperties.length === 0) return;
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);

          const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
            const R = 6371;
            const dLat = (lat2 - lat1) * (Math.PI / 180);
            const dLon = (lon2 - lon1) * (Math.PI / 180);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          };

          const sorted = [...dbProperties].sort((a, b) => {
            const distA = getDistance(latitude, longitude, a.lat, a.lng);
            const distB = getDistance(latitude, longitude, b.lat, b.lng);
            return distA - distB;
          });

          setTrendingProps(sorted.slice(0, 3));
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, [dbProperties]);

  // Reverting to the original icon structure without forced color classes
  const categories = [
    { name: "All Rentals", icon: Globe },
    { name: "Apartments", icon: Building2 },
    { name: "Family Homes", icon: House },
    { name: "Bedspaces", icon: Users },
    { name: "Condos", icon: Zap },
    { name: "Budget", icon: Wallet },
    { name: "Trending", icon: Flame },
  ];

  const [selectedProperty, setSelectedProperty] = useState<FeedProperty | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [dynamicPlaces, setDynamicPlaces] = useState<SearchSuggestion[]>([]);

  const suggestionCache = useRef<Record<string, SearchSuggestion[]>>({});

  useEffect(() => {
    const query = location.trim();
    if (query.length < 2) {
      setDynamicPlaces([]);
      return;
    }

    // Check cache first
    if (suggestionCache.current[query]) {
      setDynamicPlaces(suggestionCache.current[query]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/locations?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (data.locations) {
          suggestionCache.current[query] = data.locations;
          setDynamicPlaces(data.locations);
        }
      } catch (err) {
        console.error("Failed to fetch location suggestions:", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [location]);

  type SearchSuggestion = {
    id: string;
    label: string;
    subLabel: string;
    kind: "listing" | "place";
  };

  const searchSuggestions = useMemo<SearchSuggestion[]>(() => {
    const query = location.trim().toLowerCase();
    if (query.length < 2) return [];

    const listingMatches: SearchSuggestion[] = dbProperties
      .filter((property) => {
        return (
          property.name.toLowerCase().includes(query) ||
          property.address.toLowerCase().includes(query)
        );
      })
      .slice(0, 4)
      .map((property) => ({
        id: `listing-${property.id}`,
        label: property.name,
        subLabel: property.address,
        kind: "listing",
      }));

    const combined = [...listingMatches];
    // Add dynamic places if they haven't been added yet (avoid exact duplicates by label)
    for (const place of dynamicPlaces) {
      if (!combined.some((item) => item.label.toLowerCase() === place.label.toLowerCase())) {
        combined.push(place);
      }
    }

    return combined.slice(0, 6);
  }, [location, dbProperties, dynamicPlaces]);

  const applySuggestion = (suggestion: SearchSuggestion) => {
    setLocation(suggestion.label);
    setShowSearchSuggestions(false);
    setActiveSuggestionIndex(-1);
    setIsSearchActive(true);
  };

  const handleOpenDetails = (property: FeedProperty) => {
    setSelectedProperty(property);
    setDetailsOpen(true);
  };

  const toggleLike = (id: string) => {
    setIsLiked(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredProperties = isSearchActive ? dbProperties.filter((p) => {
    if (p.numericPrice < priceRange[0] || p.numericPrice > priceRange[1]) return false;

    if (selectedType !== "Any" && p.type) {
      const typeLower = selectedType.toLowerCase();
      const pTypeLower = (p.type || "").toLowerCase();

      if (typeLower === "apartments" && !pTypeLower.includes("apartment")) return false;
      if (typeLower === "boarding houses" && !pTypeLower.includes("boarding")) return false;
      if (typeLower === "dormitories" && !pTypeLower.includes("dorm")) return false;
    }

    if (selectedAmenities.length > 0) {
      const hasAllAmenities = selectedAmenities.every(selected => {
        const selectedLower = selected.toLowerCase();
        if (selectedLower === "pet friendly") {
          return p.houseRules.some(rule => rule.toLowerCase().includes("pet"));
        }
        return p.amenities.some(amenity => amenity.toLowerCase() === selectedLower);
      });
      if (!hasAllAmenities) return false;
    }

    if (location.trim() !== "") {
      const query = location.toLowerCase();
      if (!p.address.toLowerCase().includes(query) && !p.name.toLowerCase().includes(query)) {
        return false;
      }
    }

    return true;
  }) : [];

  if (!loading && role === 'landlord') {
    return null; // The useEffect will handle the redirect
  }

  return (
    <div className={cn("bg-[#0a0a0a] text-white font-sans selection:bg-primary/30 relative", viewMode === "list" ? "min-h-screen pb-20" : "h-screen overflow-hidden flex flex-col")}>

      {/* Navigation */}
      {loading ? (
        /* Placeholder bar while auth resolves — prevents flash of visitor nav */
        <div className="fixed top-0 z-[100] w-full h-[65px] bg-[#0a0a0a]/90 backdrop-blur-2xl border-b border-white/5" />
      ) : role === 'tenant' ? (
        <TenantNavbar />
      ) : (
        <nav className="fixed top-0 z-[100] w-full bg-[#0a0a0a]/90 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-6 md:px-12 xl:px-20 py-4 shadow-sm">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 md:gap-3 font-black text-xl tracking-wide shrink-0">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <div className="h-3 w-3 bg-white rounded-sm drop-shadow-md" />
            </div>
            <span className="hidden md:block">iRESIDE</span>
          </Link>

          {/* Desktop Search Bar Mock */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8 relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search for homes, locations, or keywords..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Actions Desktop */}
          <div className="hidden lg:flex items-center gap-6 shrink-0 font-medium">
            <Link href="/become-a-landlord" className="text-sm text-slate-300 hover:text-white transition-colors">List a Property</Link>
            <div className="w-px h-4 bg-white/10" />
            <Link href="/login" className="text-sm text-slate-300 hover:text-white transition-colors">Log In</Link>
            <Link href="/signup" className="px-6 py-2 rounded-full bg-white text-black text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 transition-all">
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-4 lg:hidden">
            <button className="p-2 text-white/70 hover:text-white transition-colors">
              <Search className="h-5 w-5" />
            </button>
            <button
              className="p-2 text-white/70 hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>
      )}
      {viewMode === "list" ? (
        <div className="overflow-y-auto h-full w-full">


          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="fixed top-[72px] left-4 right-4 bg-neutral-900/95 backdrop-blur-3xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-2 z-[90] lg:hidden"
              >
                <Link href="/search" className="p-3 bg-white/5 rounded-xl text-base font-medium text-white hover:bg-white/10 transition-colors">Rent a Home</Link>
                <div className="h-[1px] w-full bg-white/10 my-2" />
                <Link href="/login" className="p-3 text-center text-base font-semibold text-slate-300 hover:text-white transition-colors">Log In</Link>
                <Link href="/login" className="p-3 text-center text-base font-bold bg-white text-black rounded-xl shadow-md">Sign Up</Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Big Bright Hero Image with Unified Search Form */}
          <div className={cn("relative z-10", !role && "pt-[72px]")}>
            <div className="h-[480px] md:h-[520px] w-full relative">
              {/* Cinematic 3-Column Background */}
              <div className="absolute inset-0 grid grid-cols-3 w-full h-full opacity-60 select-none pointer-events-none overflow-hidden">
                {/* Apartment Column */}
                <div className="relative h-full w-full overflow-hidden border-r border-white/5">
                  <div className="absolute top-0 w-full flex flex-col animate-[scroll-up_50s_linear_infinite]">
                    <div className="relative h-[100vh] w-full"><Image alt="Apartments 1" src="/hero-images/apartment-01.png" fill className="object-cover" unoptimized /></div>
                    <div className="relative h-[100vh] w-full"><Image alt="Apartments 2" src="/hero-images/apartment-02.png" fill className="object-cover" unoptimized /></div>
                    <div className="relative h-[100vh] w-full"><Image alt="Apartments 3" src="/hero-images/apartment-03.png" fill className="object-cover" unoptimized /></div>
                    <div className="relative h-[100vh] w-full"><Image alt="Apartments 4" src="/hero-images/apartment-01.png" fill className="object-cover" unoptimized /></div>
                  </div>
                </div>

                {/* Dorm Column */}
                <div className="relative h-full w-full overflow-hidden border-r border-white/5">
                  <div className="absolute top-0 w-full flex flex-col animate-[scroll-down_45s_linear_infinite]">
                    <div className="relative h-[100vh] w-full"><Image alt="Dorms 1" src="/hero-images/dorm-01.png" fill className="object-cover" unoptimized /></div>
                    <div className="relative h-[100vh] w-full"><Image alt="Dorms 2" src="/hero-images/dorm-02.png" fill className="object-cover" unoptimized /></div>
                    <div className="relative h-[100vh] w-full"><Image alt="Dorms 3" src="/hero-images/dorm-03.png" fill className="object-cover" unoptimized /></div>
                    <div className="relative h-[100vh] w-full"><Image alt="Dorms 4" src="/hero-images/dorm-01.png" fill className="object-cover" unoptimized /></div>
                  </div>
                </div>

                {/* Boarding House Column */}
                <div className="relative h-full w-full overflow-hidden">
                  <div className="absolute top-0 w-full flex flex-col animate-[scroll-up_55s_linear_infinite]">
                    <div className="relative h-[100vh] w-full"><Image alt="Boarding 1" src="/hero-images/apartment-02.png" fill className="object-cover" unoptimized /></div>
                    <div className="relative h-[100vh] w-full"><Image alt="Boarding 2" src="/hero-images/dorm-03.png" fill className="object-cover" unoptimized /></div>
                    <div className="relative h-[100vh] w-full"><Image alt="Boarding 3" src="/hero-images/apartment-03.png" fill className="object-cover" unoptimized /></div>
                    <div className="relative h-[100vh] w-full"><Image alt="Boarding 4" src="/hero-images/apartment-02.png" fill className="object-cover" unoptimized /></div>
                  </div>
                </div>
              </div>

              {/* Dark gradient mapping to the dark mode BG */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-[#0a0a0a]" />

              <div className="absolute inset-0 flex flex-col items-center justify-end px-6 pb-12 md:pb-16">
                <h1 className="text-4xl md:text-6xl text-white font-black drop-shadow-xl text-center mb-8">
                  RENTING MADE <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-primary to-emerald-500 filter drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">EFFORTLESS.</span>
                </h1>

                {/* Comprehensive Filter Bar */}
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-3 w-full max-w-5xl flex flex-col md:flex-row items-center shadow-2xl gap-2 backdrop-blur-3xl">
                  {/* Where */}
                  <div ref={searchRef} className="relative flex-1 flex items-center bg-transparent border-b md:border-b-0 md:border-r border-white/10 px-6 py-3 w-full focus-within:bg-white/5 transition-colors group rounded-l-[2rem]">
                    <MapPin className="h-5 w-5 text-primary mr-3 shrink-0" />
                    <div className="flex flex-col w-full">
                      <span className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">Search</span>
                      <input
                        type="text"
                        value={location}
                        onFocus={() => {
                          if (searchSuggestions.length > 0) {
                            setShowSearchSuggestions(true);
                          }
                        }}
                        onChange={(e) => {
                          setLocation(e.target.value);
                          setShowSearchSuggestions(true);
                          setActiveSuggestionIndex(-1);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowDown") {
                            if (!showSearchSuggestions && searchSuggestions.length > 0) {
                              setShowSearchSuggestions(true);
                              setActiveSuggestionIndex(0);
                              return;
                            }

                            if (searchSuggestions.length > 0) {
                              e.preventDefault();
                              setActiveSuggestionIndex((prev) =>
                                prev < searchSuggestions.length - 1 ? prev + 1 : 0
                              );
                            }
                            return;
                          }

                          if (e.key === "ArrowUp") {
                            if (searchSuggestions.length > 0) {
                              e.preventDefault();
                              setActiveSuggestionIndex((prev) =>
                                prev > 0 ? prev - 1 : searchSuggestions.length - 1
                              );
                            }
                            return;
                          }

                          if (e.key === "Escape") {
                            setShowSearchSuggestions(false);
                            setActiveSuggestionIndex(-1);
                            return;
                          }

                          if (e.key === "Enter") {
                            if (
                              showSearchSuggestions &&
                              activeSuggestionIndex >= 0 &&
                              activeSuggestionIndex < searchSuggestions.length
                            ) {
                              e.preventDefault();
                              applySuggestion(searchSuggestions[activeSuggestionIndex]);
                              return;
                            }

                            setIsSearchActive(true);
                            setShowSearchSuggestions(false);
                            setActiveSuggestionIndex(-1);
                          }
                        }}
                        placeholder="Search by property, unit, or location"
                        className="bg-transparent border-none outline-none text-white w-full placeholder:text-slate-600 font-bold text-sm md:text-base p-0"
                      />
                    </div>

                    <AnimatePresence>
                      {showSearchSuggestions && searchSuggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="absolute top-full left-4 right-4 mt-2 rounded-2xl border border-white/10 bg-[#0f0f0f] shadow-2xl overflow-hidden z-[110]"
                        >
                          {searchSuggestions.map((suggestion, index) => (
                            <button
                              key={suggestion.id}
                              type="button"
                              onClick={() => applySuggestion(suggestion)}
                              className={cn(
                                "w-full px-4 py-3 text-left transition-colors border-b border-white/5 last:border-b-0",
                                index === activeSuggestionIndex
                                  ? "bg-white/10"
                                  : "bg-transparent hover:bg-white/5"
                              )}
                            >
                              <p className="text-sm font-semibold text-white">{suggestion.label}</p>
                              <p className="text-xs text-slate-400 truncate">{suggestion.subLabel}</p>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>


                  {/* Budget */}
                  <div
                    ref={budgetRef}
                    onClick={() => setIsBudgetOpen(!isBudgetOpen)}
                    className="hidden lg:flex items-center bg-transparent px-6 py-3 border-r border-white/10 w-[240px] cursor-pointer hover:bg-white/5 transition-colors relative"
                  >
                    <Wallet className="h-5 w-5 text-primary mr-3 shrink-0" />
                    <div className="flex flex-col w-full">
                      <span className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">Budget</span>
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm font-bold leading-none truncate pr-2">₱{priceRange[0].toLocaleString()} - ₱{priceRange[1].toLocaleString()}</span>
                        <ChevronDown className={cn("h-3 w-3 text-slate-400 transition-transform shrink-0", isBudgetOpen && "rotate-180")} />
                      </div>
                    </div>
                    {/* Budget Dropdown */}
                    <AnimatePresence>
                      {isBudgetOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 mt-2 w-[300px] bg-neutral-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden z-[100] p-5 cursor-default"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-bold text-white">Price Range</span>
                          </div>
                          <Slider.Root
                            className="relative flex items-center select-none touch-none w-full h-5 mb-6"
                            value={priceRange}
                            max={50000}
                            step={500}
                            minStepsBetweenThumbs={1}
                            onValueChange={setPriceRange}
                          >
                            <Slider.Track className="bg-white/10 relative grow rounded-full h-[3px]">
                              <Slider.Range className="absolute bg-primary rounded-full h-full" />
                            </Slider.Track>
                            <Slider.Thumb
                              className="block w-4 h-4 bg-white border-2 border-primary shadow-lg rounded-full hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-transform hover:scale-110 cursor-grab active:cursor-grabbing"
                              aria-label="Min price"
                            />
                            <Slider.Thumb
                              className="block w-4 h-4 bg-white border-2 border-primary shadow-lg rounded-full hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-transform hover:scale-110 cursor-grab active:cursor-grabbing"
                              aria-label="Max price"
                            />
                          </Slider.Root>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2">
                              <span className="text-[10px] text-slate-400 block mb-0.5">Min</span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-400">₱</span>
                                <input
                                  type="number"
                                  value={priceRange[0]}
                                  onChange={(e) => setPriceRange([Math.min(Number(e.target.value), priceRange[1]), priceRange[1]])}
                                  className="w-full bg-transparent text-sm font-bold text-white focus:outline-none"
                                />
                              </div>
                            </div>
                            <div className="w-2 h-[2px] bg-white/10" />
                            <div className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2">
                              <span className="text-[10px] text-slate-400 block mb-0.5">Max</span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-400">₱</span>
                                <input
                                  type="number"
                                  value={priceRange[1]}
                                  onChange={(e) => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0])])}
                                  className="w-full bg-transparent text-sm font-bold text-white focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Type */}
                  <div
                    ref={typeRef}
                    onClick={() => setIsTypeOpen(!isTypeOpen)}
                    className="hidden xl:flex items-center bg-transparent px-6 py-3 w-[160px] cursor-pointer hover:bg-white/5 transition-colors relative"
                  >
                    <House className="h-5 w-5 text-primary mr-3 shrink-0" />
                    <div className="flex flex-col w-full">
                      <span className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">Type</span>
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm font-bold leading-none truncate pr-2">{selectedType}</span>
                        <ChevronDown className={cn("h-3 w-3 text-slate-400 transition-transform shrink-0", isTypeOpen && "rotate-180")} />
                      </div>
                    </div>
                    {/* Type Dropdown */}
                    <AnimatePresence>
                      {isTypeOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 mt-2 w-[180px] bg-neutral-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden z-[100]"
                        >
                          {typeOptions.map((opt) => (
                            <div
                              key={opt}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedType(opt);
                                setIsTypeOpen(false);
                              }}
                              className="px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                            >
                              {opt}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Amenities */}
                  <div
                    ref={amenitiesRef}
                    onClick={() => setIsAmenitiesOpen(!isAmenitiesOpen)}
                    className="hidden xl:flex items-center bg-transparent px-6 py-3 border-l border-white/10 w-[180px] cursor-pointer hover:bg-white/5 transition-colors rounded-r-[2rem] relative"
                  >
                    <CheckSquare className="h-5 w-5 text-primary mr-3 shrink-0" />
                    <div className="flex flex-col w-full">
                      <span className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">Amenities</span>
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm font-bold leading-none truncate pr-2">
                          {selectedAmenities.length > 0 ? `${selectedAmenities.length} Selected` : "Click to add"}
                        </span>
                        <ChevronDown className={cn("h-3 w-3 text-slate-400 transition-transform shrink-0", isAmenitiesOpen && "rotate-180")} />
                      </div>
                    </div>
                    {/* Amenities Dropdown */}
                    <AnimatePresence>
                      {isAmenitiesOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full right-0 mt-2 w-[240px] bg-neutral-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden z-[100]"
                        >
                          {amenitiesOptions.map((opt) => {
                            const isSelected = selectedAmenities.includes(opt);
                            return (
                              <div
                                key={opt}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAmenities(prev =>
                                    isSelected ? prev.filter(a => a !== opt) : [...prev, opt]
                                  );
                                }}
                                className="px-4 py-3 text-sm flex items-center justify-between hover:bg-white/10 cursor-pointer transition-colors"
                              >
                                <span className={isSelected ? "text-white font-medium" : "text-slate-300"}>{opt}</span>
                                {isSelected && <Check className="h-4 w-4 text-primary" />}
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    onClick={() => setIsSearchActive(true)}
                    className="w-full md:w-auto px-10 py-4 bg-white hover:bg-primary text-black hover:text-white rounded-[1.8rem] font-black text-xs tracking-widest uppercase transition-all shadow-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] flex justify-center items-center ml-2 cursor-pointer"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>

          {!isSearchActive ? (
            <>
              {/* Categories Bar */}
              <div className="bg-[#0a0a0a] shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-b border-white/5 mb-12">
                <div className="flex overflow-x-auto no-scrollbar py-6 px-6 md:px-12 xl:px-20 gap-8 justify-start md:justify-center items-center">
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => setActiveCategory(cat.name)}
                      className="flex flex-col items-center gap-3 group min-w-max cursor-pointer text-slate-500 hover:text-white"
                    >
                      <div className={cn(
                        "p-4 rounded-[1.25rem] transition-all duration-300 border",
                        activeCategory === cat.name
                          ? "bg-primary border-primary text-black shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-110"
                          : "bg-neutral-900 border-white/10 group-hover:border-white/30 text-slate-400 group-hover:text-white hover:scale-105"
                      )}>
                        <cat.icon className="h-6 w-6" />
                      </div>
                      <span className={cn(
                        "text-[11px] md:text-xs font-bold tracking-wide transition-colors",
                        activeCategory === cat.name ? "text-primary" : "text-slate-400 group-hover:text-white"
                      )}>
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Feed Content */}
              <main className="px-6 md:px-12 xl:px-20 max-w-[1800px] mx-auto pt-4 space-y-16">

                {/* Feature Highlight Banner (Smart Contracts / Verification) */}
                <div className="relative w-full rounded-[2rem] overflow-hidden mb-12 group cursor-pointer border border-white/5 isolate bg-gradient-to-r from-emerald-900/50 to-[#0a0a0a] flex flex-col md:flex-row items-center shadow-xl shadow-primary/5 hover:shadow-primary/20 transition-all duration-500 h-auto md:h-[320px]">
                  <Image
                    src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2000&auto=format&fit=crop"
                    alt="Smart Contracts Banner"
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-105 opacity-40 mix-blend-overlay"
                  />

                  <div className="relative flex-1 p-8 md:p-14 z-10 text-white w-full">
                    <span className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 w-max mb-6 text-[10px] font-black uppercase tracking-widest text-white">
                      <Sparkles className="h-3 w-3 text-emerald-400" /> New Feature
                    </span>
                    <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter text-white leading-none">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-primary to-emerald-500">PAPERLESS</span> <br />
                      LEASING.
                    </h2>
                    <p className="text-slate-300 text-sm md:text-base mb-8 font-medium max-w-md">
                      Sign smart contracts instantly. iReside ensures secure, legally-binding digital agreements right from your device.
                    </p>
                    <button className="bg-white text-black px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest w-max hover:bg-primary hover:text-white transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2 group/btn">
                      Learn More <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                  </div>
                </div>

                {/* Dynamic Editorial Feed */}
                <div className="space-y-24">

                  {/* Section 1: Trending Now (Grid) */}
                  <section>
                    <div className="flex items-end justify-between mb-8">
                      <div>
                        <h3 className="text-3xl font-black tracking-tighter flex items-center gap-3 text-white">
                          Trending Now <Flame className="h-6 w-6 text-orange-500" />
                        </h3>
                        <p className="text-slate-400 text-sm md:text-base font-medium mt-2">Properties everyone is booking right now.</p>
                      </div>
                      <Link href="/search" className="text-sm font-bold text-slate-300 hover:text-white flex items-center gap-1 group transition-colors">
                        See all <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {trendingProps.map((property, idx) => (
                        <PropertyCard
                          key={`${property.id}-trending-${idx}`}
                          property={property as any}
                          isLiked={!!isLiked[property.id]}
                          onLike={() => toggleLike(property.id)}
                          onClick={handleOpenDetails}
                        />
                      ))}
                    </div>
                  </section>

                  {/* Section 2: Explore by Property Type (Visual Posters) */}
                  <section>
                    <div className="flex items-end justify-between mb-8">
                      <div>
                        <h3 className="text-3xl font-black tracking-tighter flex items-center gap-3 text-white">
                          Discover by Category
                        </h3>
                        <p className="text-slate-400 text-sm md:text-base font-medium mt-2">Find the perfect space for your lifestyle.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Poster 1 */}
                      <Link href="/search?type=apartment" className="group relative h-[350px] md:h-[450px] w-full rounded-[2rem] overflow-hidden shadow-xl border border-white/5 transition-all hover:shadow-primary/20 hover:-translate-y-1 block isolate">
                        <Image src="/hero-images/apartment-01.png" alt="Apartments" fill className="object-cover transition-transform duration-700 group-hover:scale-110 -z-10" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent -z-10" />
                        <div className="absolute bottom-6 left-6 right-6">
                          <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block backdrop-blur-md">Popular</span>
                          <h4 className="text-3xl font-black text-white leading-none mb-2">Premium<br />Apartments</h4>
                          <p className="text-slate-300 text-sm flex items-center gap-2 group-hover:text-primary transition-colors font-medium mt-3">Explore properties <ChevronRight className="h-4 w-4" /></p>
                        </div>
                      </Link>
                      {/* Poster 2 */}
                      <Link href="/search?type=dorm" className="group relative h-[350px] md:h-[450px] w-full rounded-[2rem] overflow-hidden shadow-xl border border-white/5 transition-all hover:shadow-primary/20 hover:-translate-y-1 block isolate">
                        <Image src="/hero-images/dorm-02.png" alt="Dorms" fill className="object-cover transition-transform duration-700 group-hover:scale-110 -z-10" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent -z-10" />
                        <div className="absolute bottom-6 left-6 right-6">
                          <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block backdrop-blur-md">Students</span>
                          <h4 className="text-3xl font-black text-white leading-none mb-2">Student<br />Dorms</h4>
                          <p className="text-slate-300 text-sm flex items-center gap-2 group-hover:text-primary transition-colors font-medium mt-3">Explore properties <ChevronRight className="h-4 w-4" /></p>
                        </div>
                      </Link>
                      {/* Poster 3 */}
                      <Link href="/search?type=boarding" className="group relative h-[350px] md:h-[450px] w-full rounded-[2rem] overflow-hidden shadow-xl border border-white/5 transition-all hover:shadow-primary/20 hover:-translate-y-1 block isolate">
                        <Image src="/hero-images/apartment-03.png" alt="Boarding" fill className="object-cover transition-transform duration-700 group-hover:scale-110 -z-10" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent -z-10" />
                        <div className="absolute bottom-6 left-6 right-6">
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block backdrop-blur-md">Budget</span>
                          <h4 className="text-3xl font-black text-white leading-none mb-2">Boarding<br />Houses</h4>
                          <p className="text-slate-300 text-sm flex items-center gap-2 group-hover:text-primary transition-colors font-medium mt-3">Explore properties <ChevronRight className="h-4 w-4" /></p>
                        </div>
                      </Link>
                    </div>
                  </section>

                  {/* Section 3: Top Rated (Grid) */}
                  <section>
                    <div className="flex items-end justify-between mb-8">
                      <div>
                        <h3 className="text-3xl font-black tracking-tighter flex items-center gap-3 text-white">
                          Top Rated Places <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                        </h3>
                        <p className="text-slate-400 text-sm md:text-base font-medium mt-2">Highly reviewed homes directly from verified hosts.</p>
                      </div>
                      <Link href="/search" className="text-sm font-bold text-slate-300 hover:text-white flex items-center gap-1 group transition-colors">
                        View more <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {[...dbProperties].reverse().slice(0, 3).map((property, idx) => (
                        <PropertyCard
                          key={`${property.id}-rated-${idx}`}
                          property={property as any}
                          isLiked={!!isLiked[property.id]}
                          onLike={() => toggleLike(property.id)}
                          onClick={handleOpenDetails}
                        />
                      ))}
                    </div>
                  </section>

                  {/* Section 4: Budget Friendly */}
                  <section>
                    <div className="flex items-end justify-between mb-8">
                      <div>
                        <h3 className="text-3xl font-black tracking-tighter flex items-center gap-3 text-white">
                          Find a Steal <Wallet className="h-6 w-6 text-emerald-500" />
                        </h3>
                        <p className="text-slate-400 text-sm md:text-base font-medium mt-2">Great stays that won't break the bank.</p>
                      </div>
                      <Link href="/search" className="text-sm font-bold text-slate-300 hover:text-white flex items-center gap-1 group transition-colors">
                        See all <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 xl:gap-5">
                      {[...dbProperties].sort((a, b) => a.numericPrice - b.numericPrice).slice(0, 4).map((property, idx) => (
                        <div key={`${property.id}-budget-${idx}`} className="xl:scale-[0.98] origin-top xl:-mx-2">
                          <PropertyCard
                            property={property as any}
                            isLiked={!!isLiked[property.id]}
                            onLike={() => toggleLike(property.id)}
                            onClick={handleOpenDetails}
                          />
                        </div>
                      ))}
                    </div>
                  </section>

                </div>

                {/* Section 5: App Promo Banner */}
                <section className="pt-10 pb-12">
                  <h3 className="text-3xl font-black tracking-tighter text-white mb-8">
                    More to explore
                  </h3>

                  <div className="relative w-full rounded-[2rem] overflow-hidden bg-[#111] border border-white/5 flex flex-col lg:flex-row shadow-2xl min-h-[400px]">
                    {/* Abstract decorative shapes */}
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-900/40 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

                    {/* Left Side (Content) */}
                    <div className="relative z-10 p-10 md:p-14 lg:w-[55%] flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/20">
                          <Smartphone className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-primary">iReside Mobile</span>
                      </div>

                      <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-tight mb-6">
                        Your all-in-one <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-primary to-emerald-500">home rental app</span>
                      </h2>

                      <p className="text-slate-300 text-sm md:text-md mb-10 max-w-md font-medium leading-relaxed">
                        Unlock exclusive listings, manage your lease, process payments, and sign smart contracts instantly, seamlessly on your device.
                      </p>

                      <div className="flex flex-col xl:flex-row items-center gap-8 xl:gap-12">
                        {/* Form */}
                        <div className="w-full xl:w-auto flex-1">
                          <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Send a link to your phone</span>
                          <div className="flex gap-2 w-full max-w-sm">
                            <div className="relative flex-1">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                              <input
                                type="email"
                                placeholder="Email address"
                                className="w-full bg-white/5 border border-white/10 rounded-full py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-slate-500"
                              />
                            </div>
                            <button className="px-6 md:px-8 py-3.5 bg-white text-black hover:bg-primary hover:text-white rounded-full font-bold text-sm transition-colors shadow-lg shadow-white/5 hover:shadow-primary/20 shrink-0">
                              Send
                            </button>
                          </div>
                        </div>

                        <div className="hidden xl:flex items-center gap-4 border-l border-white/10 pl-12 shrink-0">
                          <div className="text-right">
                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Or scan</span>
                            <span className="block text-sm text-white font-medium">To download</span>
                          </div>
                          <div className="p-3 bg-white rounded-2xl shadow-xl">
                            <QrCode className="h-16 w-16 text-black" strokeWidth={1.5} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Side (Image/Mockup) */}
                    <div className="relative lg:w-[45%] h-[300px] lg:h-auto min-h-[400px] isolate">
                      <Image
                        src="https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=2000&auto=format&fit=crop"
                        alt="Using mobile app"
                        fill
                        className="object-cover object-center md:object-[center_30%]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-l from-transparent via-[#111]/60 lg:via-[#111]/80 to-[#111]" />

                      {/* Floating Glassmorphic UI Element */}
                      <div className="absolute bottom-10 right-10 bg-black/40 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl flex items-center gap-4 hidden md:flex">
                        <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
                          <Building2 className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                          <span className="block text-xs text-slate-300 font-medium">Payment Successful</span>
                          <span className="block text-lg text-white font-bold">₱15,000.00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

              </main>

              {/* Explore More & Footer Area */}
              <div className="px-6 md:px-12 xl:px-20 max-w-[1800px] mx-auto mt-20">

                {/* Explore More Section */}
                <section className="mb-20">
                  <h2 className="text-3xl font-black text-white mb-6">Explore more on iReside</h2>
                  <h3 className="text-xl font-bold text-slate-300 mb-6">Top rental locations in the Philippines</h3>

                  <div className="flex flex-wrap gap-4">
                    {[
                      "Metro Manila", "Makati City", "Quezon City", "BGC, Taguig",
                      "Pasig City", "Cebu City", "Mandaluyong", "Alabang",
                      "Baguio City", "Davao City"
                    ].map((loc, index) => (
                      <Link
                        key={loc}
                        href={`/search?location=${loc}`}
                        className="flex items-stretch bg-[#111] hover:bg-white/10 border border-white/10 hover:border-primary/50 transition-all rounded-lg overflow-hidden group"
                      >
                        <div className="bg-white/5 px-4 py-2.5 flex items-center justify-center border-r border-white/10 group-hover:bg-primary/20 group-hover:text-primary transition-colors text-slate-400 font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="px-5 py-2.5 flex items-center justify-center text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                          {loc}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>

                {/* Divider */}
                <div className="w-full h-[1px] bg-white/10 mb-16" />

                {/* Footer */}
                <footer className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-20">
                  <div>
                    <h4 className="text-lg font-bold text-white mb-6">About iReside</h4>
                    <ul className="space-y-4">
                      {['About us', 'Careers'].map(link => (
                        <li key={link}>
                          <Link href="#" className="text-sm font-medium text-slate-400 hover:text-primary transition-colors">{link}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-6">Partnerships</h4>
                    <ul className="space-y-4">
                      <li><Link href="/become-a-landlord" className="text-sm font-medium text-slate-400 hover:text-primary transition-colors">Landlord sign up</Link></li>
                      <li><Link href="/login" className="text-sm font-medium text-slate-400 hover:text-primary transition-colors">Landlord log in</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-6">Terms of use</h4>
                    <ul className="space-y-4">
                      {['General terms of use', 'Privacy policy', 'Cookie Policy', 'Data Privacy Statement'].map(link => (
                        <li key={link}>
                          <Link href="#" className="text-sm font-medium text-slate-400 hover:text-primary transition-colors">{link}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </footer>

                {/* Footer Bottom Bar */}
                <div className="border-t border-white/10 pt-8 pb-12 flex flex-col md:flex-row items-center justify-between gap-4">
                  <p className="text-sm font-medium text-slate-500">
                    © {new Date().getFullYear()} iReside. All rights reserved.
                  </p>
                  <div className="flex items-center gap-6">
                    <Link href="#" className="text-slate-500 hover:text-white transition-colors">
                      <span className="sr-only">Facebook</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                      </svg>
                    </Link>
                    <Link href="#" className="text-slate-500 hover:text-white transition-colors">
                      <span className="sr-only">Instagram</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                      </svg>
                    </Link>
                    <Link href="#" className="text-slate-500 hover:text-white transition-colors">
                      <span className="sr-only">Twitter</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>

            </>
          ) : (
            <main className="px-6 md:px-12 xl:px-20 max-w-[1800px] mx-auto pt-12 pb-20 min-h-[60vh] flex flex-col items-stretch">
              <div className="flex items-center justify-between mb-8 mt-4">
                <div>
                  <h2 className="text-3xl font-black text-white">Search Results</h2>
                  <p className="text-slate-400 text-sm mt-1">{filteredProperties.length} properties found</p>
                </div>
                <button
                  onClick={() => setIsSearchActive(false)}
                  className="text-sm font-bold text-slate-400 hover:text-white transition-colors border border-white/10 px-4 py-2 rounded-full hover:bg-white/5"
                >
                  Clear Search
                </button>
              </div>
              {filteredProperties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 xl:gap-5">
                  {filteredProperties.map((property) => (
                    <div key={property.id} className="xl:scale-[0.98] origin-top xl:-mx-2">
                      <PropertyCard
                        property={property as any}
                        isLiked={!!isLiked[property.id]}
                        onLike={() => toggleLike(property.id)}
                        onClick={handleOpenDetails}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 py-20 text-slate-400">
                  <Search className="h-16 w-16 mb-6 opacity-20" />
                  <h3 className="text-2xl font-bold text-white mb-2">No properties found</h3>
                  <p>Try adjusting your search filters to find more places.</p>
                </div>
              )}
            </main>
          )}

        </div>
      ) : (
        <div className="pt-[72px] flex-1 overflow-hidden relative w-full h-full flex flex-col">
          <SearchMapView />
        </div>
      )}


      {/* Floating Toggle Button */}
      {viewMode === "list" && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4">
          <button
            onClick={() => setViewMode("map")}
            className="bg-neutral-900 border border-neutral-700 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 hover:bg-neutral-800 transition-colors font-bold group"
          >
            <>Map Search <MapIcon className="h-5 w-5 group-hover:scale-110 transition-transform" /></>
          </button>
        </div>
      )}
      {viewMode === "map" && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4">
          <button
            onClick={() => setViewMode("list")}
            className="bg-neutral-900 border border-neutral-700 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 hover:bg-neutral-800 transition-colors font-bold group"
          >
            <>Feed View <List className="h-5 w-5 group-hover:scale-110 transition-transform" /></>
          </button>
        </div>
      )}

      <style jsx global>{`
        @keyframes scroll-up {
          from { transform: translateY(0); }
          to { transform: translateY(-50%); }
        }
        @keyframes scroll-down {
          from { transform: translateY(-50%); }
          to { transform: translateY(0); }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <PropertyDetailModal
        property={selectedProperty}
        isLiked={selectedProperty ? !!isLiked[selectedProperty.id] : false}
        onLike={toggleLike}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}

export default function LandingPage() {
  return (
    <AuthProvider>
      <LandingPageContent />
    </AuthProvider>
  );
}
