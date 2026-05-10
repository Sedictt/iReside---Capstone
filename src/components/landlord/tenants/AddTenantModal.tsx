'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    X, 
    User, 
    Mail, 
    Phone, 
    Building2, 
    Home, 
    Calendar, 
    Wallet,
    CheckCircle2,
    Copy,
    AlertCircle,
    Loader2,
    Link as LinkIcon,
    QrCode,
    Share2,
    Sparkles
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useProperty } from '@/context/PropertyContext'
import { toast } from 'sonner'

interface AddTenantModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function AddTenantModal({ isOpen, onClose, onSuccess }: AddTenantModalProps) {
    const { properties } = useProperty()
    const [activeTab, setActiveTab] = useState<'manual' | 'invite'>('manual')
    const [loading, setLoading] = useState(false)
    const [successData, setSuccessData] = useState<{ tempPassword: string | null; email: string } | null>(null)
    const [inviteResult, setInviteResult] = useState<{ shareUrl: string; qrUrl: string } | null>(null)
    
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        propertyId: '',
        unitId: '',
        startDate: '',
        endDate: '',
        monthlyRent: 0,
        securityDeposit: 0,
    })

    const [inviteData, setInviteData] = useState({
        propertyId: '',
        expiresAt: '',
    })

    // Auto-select first property
    useEffect(() => {
        if (properties.length > 0 && !formData.propertyId) {
            const firstProp = properties[0]
            setFormData(prev => ({
                ...prev,
                propertyId: firstProp.id,
                unitId: firstProp.units[0]?.id || '',
                monthlyRent: firstProp.units[0]?.rentAmount || 0
            }))
            setInviteData(prev => ({
                ...prev,
                propertyId: firstProp.id
            }))
        }
    }, [properties, formData.propertyId])

    const selectedProperty = properties.find(p => p.id === formData.propertyId)
    const availableUnits = selectedProperty?.units || []

    const handlePropertyChange = (propertyId: string) => {
        const prop = properties.find(p => p.id === propertyId)
        setFormData(prev => ({
            ...prev,
            propertyId,
            unitId: prop?.units[0]?.id || '',
            monthlyRent: prop?.units[0]?.rentAmount || 0
        }))
    }

    const handleUnitChange = (unitId: string) => {
        const unit = availableUnits.find(u => u.id === unitId)
        setFormData(prev => ({
            ...prev,
            unitId,
            monthlyRent: unit?.rentAmount || 0
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.unitId) {
            toast.error('Please select a unit')
            return
        }

        try {
            setLoading(true)
            const response = await fetch('/api/landlord/tenants/manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to add tenant')
            }

            setSuccessData({
                tempPassword: data.tempPassword,
                email: formData.email
            })
            toast.success('Tenant added successfully')
            onSuccess()
        } catch (error) {
            console.error('Error adding tenant:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to add tenant')
        } finally {
            setLoading(false)
        }
    }

    const handleGenerateInvite = async () => {
        if (!inviteData.propertyId) {
            toast.error('Please select a property')
            return
        }

        try {
            setLoading(true)
            const response = await fetch('/api/landlord/invites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'property',
                    applicationType: 'existing_tenant',
                    propertyId: inviteData.propertyId,
                    expiresAt: inviteData.expiresAt || null,
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate invite')
            }

            setInviteResult({
                shareUrl: data.invite.shareUrl,
                qrUrl: data.invite.qrUrl
            })
            toast.success('Onboarding link generated!')
        } catch (error) {
            console.error('Error generating invite:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to generate link')
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Copied to clipboard')
    }

    if (!isOpen) return null

    const isSuccess = successData || inviteResult

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={isSuccess ? undefined : onClose}
                    className="absolute inset-0 bg-background/80 backdrop-blur-md"
                />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-2xl"
                >
                    {!isSuccess ? (
                        <>
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-8 pt-6 pb-2">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black tracking-tight text-foreground">Onboard Residents</h2>
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                                        Streamline entry for running apartments
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="rounded-2xl bg-muted p-3 text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            {/* Tabs (§8.5) */}
                            <div className="flex gap-1 border-b border-border bg-muted/30 px-8 py-4">
                                {[
                                    { id: 'manual', label: 'Manual Entry', icon: User },
                                    { id: 'invite', label: 'Invite Link', icon: LinkIcon },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as 'manual' | 'invite')}
                                        className={cn(
                                            "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all",
                                            activeTab === tab.id 
                                                ? "bg-foreground text-background shadow-md"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        <tab.icon className="size-3.5" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto p-8">
                                {activeTab === 'manual' ? (
                                    <form onSubmit={handleSubmit}>
                                        <div className="grid gap-8 sm:grid-cols-2">
                                            {/* Tenant Info Section */}
                                            <div className="space-y-6">
                                                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-primary">
                                                    <User className="size-4" />
                                                    Resident Profile
                                                </h3>
                                                
                                                <div className="space-y-2">
                                                    <label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Full Name</label>
                                                    <div className="relative">
                                                        <User className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
                                                        <input
                                                            id="fullName"
                                                            required
                                                            type="text"
                                                            placeholder="Juan Dela Cruz"
                                                            value={formData.fullName}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                                            className="w-full rounded-2xl border border-border bg-muted/50 py-3.5 pl-12 pr-5 text-sm font-bold outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Email Address</label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
                                                        <input
                                                            id="email"
                                                            required
                                                            type="email"
                                                            placeholder="juan@example.com"
                                                            value={formData.email}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                                            className="w-full rounded-2xl border border-border bg-muted/50 py-3.5 pl-12 pr-5 text-sm font-bold outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Phone Number</label>
                                                    <div className="relative">
                                                        <Phone className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
                                                        <input
                                                            id="phone"
                                                            required
                                                            type="tel"
                                                            placeholder="0912 345 6789"
                                                            value={formData.phone}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                                            className="w-full rounded-2xl border border-border bg-muted/50 py-3.5 pl-12 pr-5 text-sm font-bold outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Lease Info Section */}
                                            <div className="space-y-6">
                                                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-primary">
                                                    <Building2 className="size-4" />
                                                    Lease Agreement
                                                </h3>

                                                <div className="space-y-2">
                                                    <label htmlFor="propertyId" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Property</label>
                                                    <div className="relative">
                                                        <Building2 className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
                                                        <select
                                                            id="propertyId"
                                                            required
                                                            value={formData.propertyId}
                                                            onChange={(e) => handlePropertyChange(e.target.value)}
                                                            className="w-full appearance-none rounded-2xl border border-border bg-muted/50 py-3.5 pl-12 pr-5 text-sm font-bold outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                                                        >
                                                            <option value="" disabled>Select Property</option>
                                                            {properties.map(p => (
                                                                <option key={p.id} value={p.id}>{p.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label htmlFor="unitId" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Unit</label>
                                                    <div className="relative">
                                                        <Home className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
                                                        <select
                                                            id="unitId"
                                                            required
                                                            value={formData.unitId}
                                                            onChange={(e) => handleUnitChange(e.target.value)}
                                                            className="w-full appearance-none rounded-2xl border border-border bg-muted/50 py-3.5 pl-12 pr-5 text-sm font-bold outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                                                        >
                                                            <option value="" disabled>Select Unit</option>
                                                            {availableUnits.map(u => (
                                                                <option key={u.id} value={u.id}>{u.name} (₱{u.rentAmount.toLocaleString()})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label htmlFor="startDate" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Start Date</label>
                                                        <input
                                                            id="startDate"
                                                            required
                                                            type="date"
                                                            value={formData.startDate}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                                            className="w-full rounded-2xl border border-border bg-muted/50 px-5 py-3.5 text-sm font-bold outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label htmlFor="endDate" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">End Date</label>
                                                        <input
                                                            id="endDate"
                                                            required
                                                            type="date"
                                                            value={formData.endDate}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                                            className="w-full rounded-2xl border border-border bg-muted/50 px-5 py-3.5 text-sm font-bold outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label htmlFor="monthlyRent" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Monthly Rent</label>
                                                        <div className="relative">
                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground/60">₱</span>
                                                            <input
                                                                id="monthlyRent"
                                                                required
                                                                type="number"
                                                                value={formData.monthlyRent}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, monthlyRent: parseFloat(e.target.value) }))}
                                                                className="w-full rounded-2xl border border-border bg-muted/50 py-3.5 pl-8 pr-5 text-sm font-bold outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label htmlFor="securityDeposit" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Security Deposit</label>
                                                        <div className="relative">
                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground/60">₱</span>
                                                            <input
                                                                id="securityDeposit"
                                                                type="number"
                                                                value={formData.securityDeposit}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, securityDeposit: parseFloat(e.target.value) }))}
                                                                className="w-full rounded-2xl border border-border bg-muted/50 py-3.5 pl-8 pr-5 text-sm font-bold outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="mt-12 flex gap-4">
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
                                                {loading ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Loader2 className="size-4 animate-spin" />
                                                        <span>Registering Resident...</span>
                                                    </div>
                                                ) : 'Register Resident'}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-8">
                                        <div className="rounded-[2rem] border border-primary/20 bg-primary/5 p-6 text-center">
                                            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                <Sparkles className="size-6" />
                                            </div>
                                            <h3 className="text-lg font-black text-foreground">Self-Onboarding Link</h3>
                                            <p className="mt-1 text-sm text-muted-foreground">Residents can register their current lease details via this link.</p>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label htmlFor="invitePropertyId" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Target Property</label>
                                                <div className="relative">
                                                    <Building2 className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
                                                    <select
                                                        id="invitePropertyId"
                                                        required
                                                        value={inviteData.propertyId}
                                                        onChange={(e) => setInviteData(prev => ({ ...prev, propertyId: e.target.value }))}
                                                        className="w-full appearance-none rounded-2xl border border-border bg-muted/50 py-3.5 pl-12 pr-5 text-sm font-bold outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                                                    >
                                                        <option value="" disabled>Select Property</option>
                                                        {properties.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label htmlFor="expiresAt" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Expiration (Optional)</label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
                                                    <input
                                                        id="expiresAt"
                                                        type="date"
                                                        value={inviteData.expiresAt}
                                                        onChange={(e) => setInviteData(prev => ({ ...prev, expiresAt: e.target.value }))}
                                                        className="w-full rounded-2xl border border-border bg-muted/50 py-3.5 pl-12 pr-5 text-sm font-bold outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                className="flex-1 rounded-2xl border border-border bg-muted/30 py-4 text-sm font-black transition-all hover:bg-muted"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleGenerateInvite}
                                                disabled={loading}
                                                className="flex-[2] rounded-2xl bg-primary py-4 text-sm font-black text-primary-foreground shadow-2xl shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                                            >
                                                {loading ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Loader2 className="size-4 animate-spin" />
                                                        <span>Generating Link...</span>
                                                    </div>
                                                ) : 'Generate Onboarding Link'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="p-10 text-center">
                            {successData ? (
                                <>
                                    <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                                        <CheckCircle2 className="size-10" />
                                    </div>
                                    <h2 className="text-2xl font-black text-foreground">Resident Registered!</h2>
                                    <p className="mt-2 text-muted-foreground">The resident has been successfully added to the system.</p>
                                    
                                    {successData.tempPassword ? (
                                        <div className="mt-8 rounded-[2rem] border border-border bg-muted/30 p-8">
                                            <div className="mb-4 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                                                <AlertCircle className="size-4" />
                                                <span>Temporary Credentials</span>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between rounded-2xl bg-background p-4 border border-border">
                                                    <div className="text-left">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Email</p>
                                                        <p className="text-sm font-bold text-foreground">{successData.email}</p>
                                                    </div>
                                                    <button onClick={() => copyToClipboard(successData.email)} className="p-2 text-muted-foreground hover:text-primary">
                                                        <Copy className="size-4" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between rounded-2xl bg-background p-4 border border-border">
                                                    <div className="text-left">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Temp Password</p>
                                                        <p className="font-mono text-lg font-black text-primary tracking-wider">{successData.tempPassword}</p>
                                                    </div>
                                                    <button onClick={() => copyToClipboard(successData.tempPassword!)} className="p-2 text-muted-foreground hover:text-primary">
                                                        <Copy className="size-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-8 rounded-[2rem] border border-border bg-emerald-500/5 p-8 text-emerald-600">
                                            <p className="text-sm font-bold">This email is already registered on iReside. The resident can log in using their existing credentials.</p>
                                        </div>
                                    )}
                                </>
                            ) : inviteResult && (
                                <>
                                    <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <QrCode className="size-10" />
                                    </div>
                                    <h2 className="text-2xl font-black text-foreground">Onboarding Link Ready</h2>
                                    <p className="mt-2 text-muted-foreground">Share this with your residents to start self-onboarding.</p>

                                    <div className="mt-8 space-y-6">
                                        <div className="flex items-center justify-center rounded-3xl border border-border bg-muted/10 p-6">
                                            <div className="relative size-48 overflow-hidden rounded-2xl shadow-lg">
                                                <Image 
                                                    src={inviteResult.qrUrl} 
                                                    alt="QR Code" 
                                                    fill
                                                    className="object-contain"
                                                    unoptimized
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between rounded-2xl bg-muted/30 p-4 border border-border">
                                            <div className="text-left truncate max-w-[300px]">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Onboarding URL</p>
                                                <p className="text-sm font-bold text-foreground truncate">{inviteResult.shareUrl}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => copyToClipboard(inviteResult.shareUrl)} className="p-2 text-muted-foreground hover:text-primary">
                                                    <Copy className="size-4" />
                                                </button>
                                                <button className="p-2 text-muted-foreground hover:text-primary">
                                                    <Share2 className="size-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <button
                                onClick={onClose}
                                className="mt-10 w-full rounded-2xl bg-foreground py-4 text-sm font-black text-background transition-all hover:bg-foreground/90 active:scale-95"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    )
}


