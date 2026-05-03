'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    Sparkle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProperty } from '@/context/PropertyContext'
import { upsertAmenity } from '@/lib/queries/amenities'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface AddAmenityModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    landlordId: string
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
        price_per_unit: 0,
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
            
            let uploadedImageUrl = formData.image_url
            if (photoFile) {
                const supabase = createClient()
                const fileExt = photoFile.name.split('.').pop()
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
                const filePath = `amenities/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('property-images')
                    .upload(filePath, photoFile)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('property-images')
                    .getPublicUrl(filePath)
                
                uploadedImageUrl = publicUrl
            }

            await upsertAmenity({
                ...formData,
                landlord_id: landlordId,
                image_url: uploadedImageUrl,
                price_per_unit: Number(formData.price_per_unit),
                capacity: Number(formData.capacity)
            })
            toast.success('Facility added successfully')
            onSuccess()
            onClose()
        } catch (error) {
            console.error('Error adding facility:', error)
            toast.error('Failed to add facility')
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
                    className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border bg-muted/30 px-8 py-6">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black tracking-tight">Add New Facility</h2>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                                Expand your property assets
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-2xl bg-muted p-3 text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8">
                        <div className="grid gap-8 sm:grid-cols-2">
                            {/* Left Column */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                                        Property
                                    </label>
                                    <select
                                        required
                                        value={formData.property_id}
                                        onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                                        className="w-full rounded-2xl border border-border bg-muted/50 px-5 py-3.5 text-sm font-bold outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                                    >
                                        <option value="" disabled>Select a property</option>
                                        {properties.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                                        Facility Name
                                    </label>
                                    <div className="relative">
                                        <Zap className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
                                        <input
                                            required
                                            type="text"
                                            placeholder="e.g., Sky Pool, Game Room"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full rounded-2xl border border-border bg-muted/50 py-3.5 pl-12 pr-5 text-sm font-bold outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                                            Type
                                        </label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full rounded-2xl border border-border bg-muted/50 px-5 py-3.5 text-sm font-bold outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                                        >
                                            {AMENITY_TYPES.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                                            Capacity
                                        </label>
                                        <div className="relative">
                                            <Users className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
                                            <input
                                                type="number"
                                                value={formData.capacity}
                                                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                                className="w-full rounded-2xl border border-border bg-muted/50 py-3.5 pl-12 pr-5 text-sm font-bold outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                                            Icon Representation
                                        </label>
                                        <div className="text-[10px] font-bold text-muted-foreground/40">
                                            Page {currentPage + 1} of {Math.max(1, totalPages)}
                                        </div>
                                    </div>

                                    {/* Search Bar for Icons */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
                                        <input
                                            type="text"
                                            placeholder="Search icons..."
                                            value={searchTerm}
                                            onChange={handleSearch}
                                            className="w-full rounded-xl border border-border bg-muted/30 py-2 pl-9 pr-4 text-xs font-bold outline-none transition-all focus:border-primary/50 focus:bg-muted/50"
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
                                                        <item.icon className="h-5 w-5" />
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
                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground transition-all hover:bg-muted disabled:opacity-30"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>
                                            <div className="flex gap-1.5">
                                                {[...Array(totalPages)].map((_, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => setCurrentPage(i)}
                                                        className={cn(
                                                            "h-1.5 w-1.5 rounded-full transition-all",
                                                            currentPage === i ? "bg-primary w-4" : "bg-muted-foreground/20 hover:bg-muted-foreground/40"
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                            <button
                                                type="button"
                                                disabled={currentPage === totalPages - 1}
                                                onClick={() => setCurrentPage(prev => prev + 1)}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground transition-all hover:bg-muted disabled:opacity-30"
                                            >
                                                <ChevronRight className="h-4 w-4" />
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
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground/60">₱</span>
                                            <input
                                                type="number"
                                                placeholder="Price"
                                                value={formData.price_per_unit}
                                                onChange={(e) => setFormData({ ...formData, price_per_unit: parseFloat(e.target.value) })}
                                                className="w-full rounded-2xl border border-border bg-muted/50 py-3.5 pl-8 pr-5 text-sm font-bold outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                                            />
                                        </div>
                                        <select
                                            value={formData.unit_type}
                                            onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
                                            className="w-full rounded-2xl border border-border bg-muted/50 px-5 py-3.5 text-sm font-bold outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                                        >
                                            <option value="hour">Per Hour</option>
                                            <option value="day">Per Day</option>
                                            <option value="free">Free</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                                        Specific Location
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
                                        <input
                                            type="text"
                                            placeholder="e.g., 5th Floor, Main Wing"
                                            value={formData.location_details}
                                            onChange={(e) => setFormData({ ...formData, location_details: e.target.value })}
                                            className="w-full rounded-2xl border border-border bg-muted/50 py-3.5 pl-12 pr-5 text-sm font-bold outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                                        Description
                                    </label>
                                    <textarea
                                        placeholder="Describe the facility's features and rules..."
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
                                                <img 
                                                    src={photoPreview} 
                                                    alt="Preview" 
                                                    className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Camera className="h-6 w-6 text-white" />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
                                                <Camera className="h-8 w-8" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Click to upload photo</span>
                                            </div>
                                        )}
                                        <input 
                                            id="facility-photo-input"
                                            type="file" 
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
                                onClick={onClose}
                                className="flex-1 rounded-2xl border border-border bg-muted/30 py-4 text-sm font-black transition-all hover:bg-muted"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-[2] rounded-2xl bg-primary py-4 text-sm font-black text-primary-foreground shadow-2xl shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Facility'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
