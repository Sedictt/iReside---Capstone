'use client'

import Image from 'next/image'
import { useState } from 'react'
import { m as motion, AnimatePresence } from "framer-motion"
import { 
    X, 
    Zap, 
    Users, 
    Waves, 
    Music, 
    Coffee, 
    MapPin,
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Dumbbell,
    Wifi,
    Tv,
    Shield,
    Thermometer,
    Trash2,
    Wind,
    Sun,
    Lock,
    Key,
    Clock,
    Info,
    Phone,
    Monitor,
    Bike,
    Briefcase,
    Utensils,
    ShowerHead,
    Baby,
    Dog,
    Trees,
    Sofa,
    Camera,
    Plug,
    BookOpen,
    Sparkles,
    Flame,
    Store,
    ShoppingBag,
    Pizza,
    ParkingCircle,
    Mountain,
    Moon,
    Mail,
    Library,
    Landmark,
    Lamp,
    Hotel,
    Home,
    Heart,
    Gift,
    Gamepad2,
    Fuel,
    Flower2,
    Fish,
    ChefHat,
    Bus,
    Building2,
    Box,
    Bath,
    BarChart3,
    Award,
    Accessibility,
    Trophy,
    Target,
    Fingerprint,
    GlassWater,
    Beer,
    Drumstick,
    Plane,
    Ship,
    Sparkle,
    Plus,
    Minus,
    Check,
    type LucideIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProperty } from '@/context/PropertyContext'
import { upsertAmenity } from '@/lib/queries/amenities'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface AddAmenityModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => Promise<void> | void
    landlordId: string
}

function ModernSelect({ 
    value, 
    onChange, 
    options, 
    placeholder, 
    icon: Icon,
    className 
}: { 
    value: string; 
    onChange: (val: string) => void; 
    options: { value: string; label: string; icon?: LucideIcon }[]; 
    placeholder: string;
    icon?: LucideIcon;
    className?: string;
}) {
    const [isOpen, setIsOpen] = useState(false)
    const selectedOption = options.find(o => o.value === value)

    return (
        <div className={cn("relative", className)}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between rounded-2xl border border-border bg-card py-3.5 pl-4 pr-4 text-sm font-black outline-none ring-primary/20 transition-all hover:border-primary/30 focus:border-primary/50 focus:ring-4 shadow-sm"
            >
                <div className="flex items-center gap-3">
                    {Icon && <Icon className="size-4 text-muted-foreground/40" />}
                    <span className={cn(
                        "truncate",
                        !value && "text-muted-foreground/50"
                    )}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDown className={cn(
                    "size-4 text-muted-foreground/30 transition-transform duration-300",
                    isOpen && "rotate-180"
                )} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div 
                            className="fixed inset-0 z-[110]" 
                            onClick={() => setIsOpen(false)} 
                        />
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ type: "spring", damping: 20, stiffness: 300 }}
                            className="absolute left-0 right-0 top-full z-[120] mt-2 max-h-[300px] overflow-auto rounded-2xl border border-border/50 bg-card/90 p-2 shadow-2xl shadow-black/20 backdrop-blur-xl"
                        >
                            <div className="space-y-1">
                                {options.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(option.value)
                                            setIsOpen(false)
                                        }}
                                        className={cn(
                                            "group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                                            value === option.value 
                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                                : "hover:bg-primary/5 hover:text-primary font-medium"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            {option.icon && <option.icon className={cn(
                                                "size-4",
                                                value === option.value ? "text-primary-foreground" : "text-muted-foreground/50 group-hover:text-primary"
                                            )} />}
                                            <span className={value === option.value ? "font-bold" : ""}>
                                                {option.label}
                                            </span>
                                        </div>
                                        {value === option.value && (
                                            <div className="size-1.5 rounded-full bg-primary-foreground" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

const AMENITY_TYPES = ['Room', 'Amenity', 'Utility']
const ICONS = [
    { name: 'Users', icon: Users },
    { name: 'Waves', icon: Waves },
    { name: 'Music', icon: Music },
    { name: 'Coffee', icon: Coffee },
    { name: 'Zap', icon: Zap },
    { name: 'Dumbbell', icon: Dumbbell },
    { name: 'Wifi', icon: Wifi },
    { name: 'Tv', icon: Tv },
    { name: 'Shield', icon: Shield },
    { name: 'Thermometer', icon: Thermometer },
    { name: 'Trash2', icon: Trash2 },
    { name: 'Wind', icon: Wind },
    { name: 'Sun', icon: Sun },
    { name: 'Lock', icon: Lock },
    { name: 'Key', icon: Key },
    { name: 'Clock', icon: Clock },
    { name: 'Info', icon: Info },
    { name: 'Phone', icon: Phone },
    { name: 'Monitor', icon: Monitor },
    { name: 'Bike', icon: Bike },
    { name: 'Briefcase', icon: Briefcase },
    { name: 'Utensils', icon: Utensils },
    { name: 'ShowerHead', icon: ShowerHead },
    { name: 'Baby', icon: Baby },
    { name: 'Dog', icon: Dog },
    { name: 'Trees', icon: Trees },
    { name: 'Sofa', icon: Sofa },
    { name: 'Camera', icon: Camera },
    { name: 'Plug', icon: Plug },
    { name: 'BookOpen', icon: BookOpen },
    { name: 'Sparkles', icon: Sparkles },
    { name: 'Flame', icon: Flame },
    { name: 'Store', icon: Store },
    { name: 'ShoppingBag', icon: ShoppingBag },
    { name: 'Pizza', icon: Pizza },
    { name: 'ParkingCircle', icon: ParkingCircle },
    { name: 'Mountain', icon: Mountain },
    { name: 'Moon', icon: Moon },
    { name: 'Mail', icon: Mail },
    { name: 'Library', icon: Library },
    { name: 'Landmark', icon: Landmark },
    { name: 'Lamp', icon: Lamp },
    { name: 'Hotel', icon: Hotel },
    { name: 'Home', icon: Home },
    { name: 'Heart', icon: Heart },
    { name: 'Gift', icon: Gift },
    { name: 'Gamepad2', icon: Gamepad2 },
    { name: 'Fuel', icon: Fuel },
    { name: 'Flower2', icon: Flower2 },
    { name: 'Fish', icon: Fish },
    { name: 'ChefHat', icon: ChefHat },
    { name: 'Bus', icon: Bus },
    { name: 'Building2', icon: Building2 },
    { name: 'Box', icon: Box },
    { name: 'Bath', icon: Bath },
    { name: 'BarChart3', icon: BarChart3 },
    { name: 'Award', icon: Award },
    { name: 'Accessibility', icon: Accessibility },
    { name: 'Trophy', icon: Trophy },
    { name: 'Target', icon: Target },
    { name: 'Fingerprint', icon: Fingerprint },
    { name: 'GlassWater', icon: GlassWater },
    { name: 'Beer', icon: Beer },
    { name: 'Drumstick', icon: Drumstick },
    { name: 'Plane', icon: Plane },
    { name: 'Ship', icon: Ship },
    { name: 'Sparkle', icon: Sparkle }
]

const ITEMS_PER_PAGE = 8

export function AddAmenityModal({ isOpen, onClose, onSuccess, landlordId }: AddAmenityModalProps) {
    const { properties } = useProperty()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        property_id: properties[0]?.id || '',
        name: '',
        type: 'Amenity',
        description: '',
        price_per_unit: '',
        unit_type: 'hour',
        capacity: 10,
        icon_name: 'Zap',
        location_details: '',
        status: 'Active',
        tags: [] as string[],
        image_url: ''
    })
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)

    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(0)
    const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
    const [filteredLocationSuggestions, setFilteredLocationSuggestions] = useState<string[]>([])

    const LOCATION_SUGGESTIONS = [
        'Ground Floor',
        '1st Floor',
        '2nd Floor',
        '3rd Floor',
        '4th Floor',
        '5th Floor',
        'Rooftop',
        'Basement',
        'Main Wing',
        'East Wing',
        'West Wing',
        'North Wing',
        'South Wing',
        'Main Building',
        'Building A',
        'Building B',
        'Building C',
        'Amenity Room',
        'Lobby',
        'Corridor',
        'Parking Area',
        'Garden Area',
        'Pool Area',
        'Gym Area',
        'Clubhouse',
        'Mail Room',
        'Laundry Room',
        'Storage Room'
    ]

    const filteredIcons = ICONS.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalPages = Math.ceil(filteredIcons.length / ITEMS_PER_PAGE)
    const paginatedIcons = filteredIcons.slice(
        currentPage * ITEMS_PER_PAGE,
        (currentPage + 1) * ITEMS_PER_PAGE
    )

    // Reset page when searching
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
        setCurrentPage(0)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.property_id) {
            toast.error('Please select a property')
            return
        }

        try {
            setLoading(true)
            console.log('[AddAmenityModal] Starting submission...', formData)
            
            let uploadedImageUrl = formData.image_url
            if (photoFile) {
                console.log('[AddAmenityModal] Uploading photo...')
                const supabase = createClient()
                const fileExt = photoFile.name.split('.').pop()?.toLowerCase() || 'jpg'
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
                const filePath = `amenities/${fileName}`

                let contentType = photoFile.type
                if (!contentType || contentType === 'application/octet-stream') {
                    if (fileExt === 'png') contentType = 'image/png'
                    else if (fileExt === 'webp' || fileExt === 'web') contentType = 'image/webp'
                    else if (fileExt === 'gif') contentType = 'image/gif'
                    else if (fileExt === 'svg') contentType = 'image/svg+xml'
                    else contentType = 'image/jpeg'
                }

                const { error: uploadError } = await supabase.storage
                    .from('property-images')
                    .upload(filePath, photoFile, {
                        contentType,
                        cacheControl: '3600',
                        upsert: false
                    })

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('property-images')
                    .getPublicUrl(filePath)
                
                uploadedImageUrl = publicUrl
                console.log('[AddAmenityModal] Photo uploaded successfully:', uploadedImageUrl)
            }

            console.log('[AddAmenityModal] Upserting amenity data...')
            await upsertAmenity({
                ...formData,
                landlord_id: landlordId,
                image_url: uploadedImageUrl,
                price_per_unit: formData.price_per_unit === '' ? 0 : Number(formData.price_per_unit),
                capacity: Number(formData.capacity)
            })
            console.log('[AddAmenityModal] Amenity upserted successfully')

            toast.success('Facility added successfully')
            
            onClose()
            
            if (onSuccess) {
                onSuccess()
            }
        } catch (error) {
            console.error('[AddAmenityModal] Submission error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to add facility')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-background/80 backdrop-blur-md"
                />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-4xl overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-2xl"
                >
                    <div className="flex items-center justify-between border-b border-border bg-muted/30 px-8 py-6">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black tracking-tight">Add New Facility</h2>
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                                Expand your property assets
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-2xl bg-muted p-3 text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500"
                        >
                            <X className="size-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8">
                        <div className="grid gap-8 sm:grid-cols-2">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="property-select" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                                        Property
                                    </label>
                                    <ModernSelect
                                        value={formData.property_id}
                                        onChange={(val) => setFormData({ ...formData, property_id: val })}
                                        options={properties.map(p => ({ value: p.id, label: p.name }))}
                                        placeholder="Select a property"
                                        icon={Building2}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="facility-name" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                                        Facility Name
                                    </label>
                                    <div className="relative">
                                        <Zap className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
                                        <input
                                            id="facility-name"
                                            required
                                            type="text"
                                            autoComplete="off"
                                            placeholder="e.g., Sky Pool, Game Room"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full rounded-2xl border border-border bg-muted/50 py-3.5 pl-12 pr-5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="facility-type" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                                            Type
                                        </label>
                                        <ModernSelect
                                            value={formData.type}
                                            onChange={(val) => setFormData({ ...formData, type: val })}
                                            options={AMENITY_TYPES.map(t => ({ value: t, label: t }))}
                                            placeholder="Select Type"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="facility-capacity" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                                            Capacity
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, capacity: Math.max(1, formData.capacity - 1) })}
                                                className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/80 text-muted-foreground transition-all hover:bg-primary/20 hover:text-primary"
                                            >
                                                <Minus className="size-5" />
                                            </button>
                                            <div className="relative flex-1">
                                                <input
                                                    id="facility-capacity"
                                                    type="number"
                                                    value={formData.capacity}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value)
                                                        setFormData({ ...formData, capacity: isNaN(val) ? 1 : Math.max(1, val) })
                                                    }}
                                                    className="w-full rounded-2xl border border-border bg-muted/50 py-3.5 px-4 text-center text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, capacity: formData.capacity + 1 })}
                                                className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/80 text-muted-foreground transition-all hover:bg-primary/20 hover:text-primary"
                                            >
                                                <Plus className="size-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="icon-search" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                                            Icon Representation
                                        </label>
                                        <div className="text-[10px] font-black text-muted-foreground/40">
                                            Page {currentPage + 1} of {Math.max(1, totalPages)}
                                        </div>
                                    </div>

                                    {/* Search Bar for Icons */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/40" />
                                        <input
                                            id="icon-search"
                                            type="text"
                                            placeholder="Search icons…"
                                            value={searchTerm}
                                            onChange={handleSearch}
                                            className="w-full rounded-xl border border-border bg-muted/30 py-2 pl-9 pr-4 text-xs font-black outline-none transition-all focus:border-primary/50 focus:bg-muted/50"
                                        />
                                    </div>

                                    <div className="relative min-h-[110px] overflow-hidden">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={currentPage + searchTerm}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.15 }}
                                                className="grid grid-cols-4 gap-3"
                                            >
                                                {paginatedIcons.map(item => (
                                                    <button
                                                        key={item.name}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, icon_name: item.name })}
                                                        className={cn(
                                                            "flex h-12 w-full items-center justify-center rounded-2xl border transition-all",
                                                            formData.icon_name === item.name
                                                                ? "border-primary bg-primary/10 text-primary"
                                                                : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
                                                        )}
                                                    >
                                                        <item.icon className="size-5" />
                                                    </button>
                                                ))}
                                                
                                                {filteredIcons.length === 0 && (
                                                    <div className="col-span-4 py-8 text-center text-xs font-medium text-muted-foreground/60">
                                                        No icons found
                                                    </div>
                                                )}
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between pt-2">
                                            <button
                                                type="button"
                                                disabled={currentPage === 0}
                                                onClick={() => setCurrentPage(prev => prev - 1)}
                                                className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground transition-all hover:bg-muted disabled:opacity-30"
                                            >
                                                <ChevronLeft className="size-4" />
                                            </button>
                                            <div className="flex gap-1.5">
                                                {[...Array(totalPages)].map((_, i) => (
                                                    <button
                                                        key={`page-${i}`}
                                                        type="button"
                                                        onClick={() => setCurrentPage(i)}
                                                        className={cn(
                                                            "size-1.5 rounded-full transition-all",
                                                            currentPage === i ? "bg-primary w-4" : "bg-muted-foreground/20 hover:bg-muted-foreground/40"
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                            <button
                                                type="button"
                                                disabled={currentPage === totalPages - 1}
                                                onClick={() => setCurrentPage(prev => prev + 1)}
                                                className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground transition-all hover:bg-muted disabled:opacity-30"
                                            >
                                                <ChevronRight className="size-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                                        Pricing Details
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground/60">₱</span>
                                            <input
                                                type="number"
                                                placeholder="Price"
                                                value={formData.price_per_unit}
                                                onChange={(e) => {
                                                    const val = e.target.value
                                                    // Allow decimal points while typing
                                                    if (val === '' || val === '.' || !isNaN(Number(val))) {
                                                        setFormData({ ...formData, price_per_unit: val })
                                                    }
                                                }}
                                                className="w-full rounded-2xl border border-border bg-muted/50 py-3.5 pl-8 pr-5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                                            />
                                        </div>
                                        <div className="relative">
                                            <ModernSelect
                                                value={formData.unit_type}
                                                onChange={(val) => setFormData({ ...formData, unit_type: val })}
                                                options={[
                                                    { value: 'hour', label: 'Per Hour' },
                                                    { value: 'day', label: 'Per Day' },
                                                    { value: 'free', label: 'Free' }
                                                ]}
                                                placeholder="Unit Type"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="location-details" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                                        Specific Location
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40 z-10" />
                                        <input
                                            id="location-details"
                                            type="text"
                                            autoComplete="off"
                                            spellCheck={false}
                                            placeholder="e.g., 5th Floor, Main Wing"
                                            value={formData.location_details}
                                            onChange={(e) => {
                                                const value = e.target.value
                                                setFormData({ ...formData, location_details: value })
                                                if (value.trim()) {
                                                    const filtered = LOCATION_SUGGESTIONS.filter(s => 
                                                        s.toLowerCase().includes(value.toLowerCase())
                                                    ).slice(0, 6)
                                                    setFilteredLocationSuggestions(filtered)
                                                    setShowLocationSuggestions(filtered.length > 0)
                                                } else {
                                                    setShowLocationSuggestions(false)
                                                }
                                            }}
                                            onFocus={() => {
                                                if (formData.location_details.trim()) {
                                                    const filtered = LOCATION_SUGGESTIONS.filter(s => 
                                                        s.toLowerCase().includes(formData.location_details.toLowerCase())
                                                    ).slice(0, 6)
                                                    setFilteredLocationSuggestions(filtered)
                                                    setShowLocationSuggestions(filtered.length > 0)
                                                }
                                            }}
                                            onBlur={() => {
                                                setTimeout(() => setShowLocationSuggestions(false), 200)
                                            }}
                                            className="w-full rounded-2xl border border-border bg-muted/50 py-3.5 pl-12 pr-5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                                        />
                                        {showLocationSuggestions && filteredLocationSuggestions.length > 0 && (
                                            <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-background py-1.5 shadow-lg">
                                                {filteredLocationSuggestions.map((suggestion, index) => (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault()
                                                            setFormData({ ...formData, location_details: suggestion })
                                                            setShowLocationSuggestions(false)
                                                        }}
                                                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors"
                                                    >
                                                        <MapPin className="size-3.5 text-muted-foreground/40" />
                                                        {suggestion}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="facility-description" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                                        Description
                                    </label>
                                    <textarea
                                        id="facility-description"
                                        placeholder="Describe the facility's features and rules…"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="min-h-[120px] w-full resize-none rounded-2xl border border-border bg-muted/50 px-5 py-4 text-sm font-medium outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                                        Facility Photo
                                    </label>
                                    <div 
                                        onClick={() => document.getElementById('facility-photo-input')?.click()}
                                        className="relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/30 transition-all hover:border-primary/50 hover:bg-muted/50 h-[120px] flex items-center justify-center"
                                    >
                                        {photoPreview ? (
                                            <>
                                                <Image
                                                    src={photoPreview}
                                                    alt="Preview"
                                                    fill
                                                    sizes="(max-width: 640px) 100vw, 350px"
                                                    className="object-cover transition-transform group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Camera className="size-6 text-white" />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
                                                <Camera className="size-8" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Click to upload photo</span>
                                            </div>
                                        )}
                                        <input 
                                            id="facility-photo-input"
                                            type="file" 
                                            suppressHydrationWarning
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) {
                                                    setPhotoFile(file)
                                                    setPhotoPreview(URL.createObjectURL(file))
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-10 flex gap-4">
                            <button
                                type="button"
                                suppressHydrationWarning
                                onClick={onClose}
                                className="flex-1 rounded-2xl border border-border bg-muted/30 py-4 text-sm font-black transition-all hover:bg-muted"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                suppressHydrationWarning
                                disabled={loading}
                                className="flex-[2] rounded-2xl bg-primary py-4 text-sm font-black text-primary-foreground shadow-2xl shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                            >
                                {loading ? 'Creating…' : 'Create Facility'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
