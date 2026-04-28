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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProperty } from '@/context/PropertyContext'
import { upsertAmenity } from '@/lib/queries/amenities'
import { toast } from 'sonner'

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
    { name: 'Zap', icon: Zap }
]

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
        tags: [] as string[]
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.property_id) {
            toast.error('Please select a property')
            return
        }

        try {
            setLoading(true)
            await upsertAmenity({
                ...formData,
                landlord_id: landlordId,
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

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                                        Icon Representation
                                    </label>
                                    <div className="flex flex-wrap gap-3">
                                        {ICONS.map(item => (
                                            <button
                                                key={item.name}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, icon_name: item.name })}
                                                className={cn(
                                                    "flex h-12 w-12 items-center justify-center rounded-2xl border transition-all",
                                                    formData.icon_name === item.name
                                                        ? "border-primary bg-primary/10 text-primary"
                                                        : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
                                                )}
                                            >
                                                <item.icon className="h-5 w-5" />
                                            </button>
                                        ))}
                                    </div>
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
