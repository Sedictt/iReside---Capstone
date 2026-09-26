'use client'

import { useState, useEffect, useMemo } from 'react'
import { m as motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  User, 
  UserPlus,
  Mail, 
  Phone, 
  Building2, 
  Home, 
  Calendar, 
  CheckCircle2, 
  Copy, 
  AlertCircle, 
  Loader2, 
  Link as LinkIcon, 
  QrCode, 
  Share2,
  DoorOpen,
  ArrowRight
} from 'lucide-react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import { useProperty } from '@/context/PropertyContext'
import { toast } from 'sonner'
import type { WalkInUnit } from '@/components/landlord/applications/application-intake-shared'

const WalkInApplicationModal = dynamic(
  () => import('@/components/landlord/applications/WalkInApplicationModal').then(mod => mod.WalkInApplicationModal),
  { ssr: false }
)

export type OnboardingTab = 'quick_add' | 'manual' | 'invite' | 'walk_in';

interface AddTenantModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialTab?: OnboardingTab
  onOpenWalkIn?: (propertyId?: string, unitId?: string) => void
}

export function AddTenantModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialTab = 'quick_add',
  onOpenWalkIn 
}: AddTenantModalProps) {
  const { properties, refreshProperties } = useProperty()
  
  const normalizeTab = (tab?: OnboardingTab): 'quick_add' | 'invite' | 'walk_in' => {
    if (tab === 'manual' || tab === 'quick_add') return 'quick_add';
    if (tab === 'walk_in') return 'walk_in';
    return 'invite';
  }

  const [activeTab, setActiveTab] = useState<'quick_add' | 'invite' | 'walk_in'>(() => normalizeTab(initialTab))
  const [loading, setLoading] = useState(false)
  const [successData, setSuccessData] = useState<{ tempPassword: string | null; email: string } | null>(null)
  const [inviteResult, setInviteResult] = useState<{ shareUrl: string; qrUrl: string } | null>(null)
  
  // Quick Add Form Data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    propertyId: '',
    unitId: '',
    startDate: '',
    endDate: '',
    monthlyRent: '',
    securityDeposit: '',
  })

  // Invite Link State
  const [isInviteAdvanced, setIsInviteAdvanced] = useState(false)
  const [inviteScope, setInviteScope] = useState<'property' | 'unit'>('property')
  const [inviteUnitId, setInviteUnitId] = useState('')
  const [inviteAppType, setInviteAppType] = useState<'existing_tenant' | 'face_to_face' | 'online'>('existing_tenant')
  const [inviteRequirements, setInviteRequirements] = useState<string[]>(['valid_id', 'proof_of_income'])
  const [invitePreset, setInvitePreset] = useState<number | null>(7)
  const [inviteData, setInviteData] = useState({
    propertyId: '',
    expiresAt: '',
  })

  // Walk-in Application State
  const [walkInPropertyId, setWalkInPropertyId] = useState('')
  const [walkInUnitId, setWalkInUnitId] = useState('')
  const [isInternalWalkInOpen, setIsInternalWalkInOpen] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(normalizeTab(initialTab))
      setLoading(false)
      setSuccessData(null)
      setInviteResult(null)
      setIsInternalWalkInOpen(false)
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        propertyId: '',
        unitId: '',
        startDate: '',
        endDate: '',
        monthlyRent: '',
        securityDeposit: '',
      })
      setInviteData({
        propertyId: '',
        expiresAt: '',
      })
    }
  }, [isOpen, initialTab])

  // Auto-select first property and vacant units
  useEffect(() => {
    if (properties.length > 0 && !formData.propertyId) {
      const firstProp = properties[0]
      setFormData(prev => ({
        ...prev,
        propertyId: firstProp.id,
        unitId: firstProp.units[0]?.id || '',
        monthlyRent: firstProp.units[0]?.rentAmount?.toString() || ''
      }))
      setInviteData(prev => ({
        ...prev,
        propertyId: firstProp.id
      }))
    }
  }, [properties, formData.propertyId])

  // Auto-select walk-in property and unit
  useEffect(() => {
    if (properties.length > 0 && !walkInPropertyId) {
      const propWithVacant = properties.find(p => p.units.some(u => (u.status ?? 'vacant') === 'vacant')) || properties[0]
      setWalkInPropertyId(propWithVacant.id)
      const firstVacant = propWithVacant.units.find(u => (u.status ?? 'vacant') === 'vacant')
      setWalkInUnitId(firstVacant?.id || propWithVacant.units[0]?.id || '')
    }
  }, [properties, walkInPropertyId])

  const selectedProperty = properties.find(p => p.id === formData.propertyId)
  const availableUnits = selectedProperty?.units || []

  const walkInProperty = properties.find(p => p.id === walkInPropertyId)
  const walkInAvailableUnits = (walkInProperty?.units || []).filter(u => (u.status ?? 'vacant') === 'vacant')

  // Transform properties into WalkInUnit array for internal modal fallback
  const allWalkInUnits = useMemo<WalkInUnit[]>(() => {
    return properties.flatMap((p) =>
      (p.units || []).map((u) => ({
        id: u.id,
        name: u.name,
        rent_amount: Number(u.rentAmount ?? 0),
        property_id: p.id,
        property_name: p.name,
        property_address: p.address,
        property_image: p.image ?? null,
        status: (u.status as "vacant" | "occupied" | "maintenance") ?? "vacant",
        has_ongoing_application: false,
        ongoing_application_status: null,
      }))
    )
  }, [properties])

  const handlePropertyChange = (propertyId: string) => {
    const prop = properties.find(p => p.id === propertyId)
    setFormData(prev => ({
      ...prev,
      propertyId,
      unitId: prop?.units[0]?.id || '',
      monthlyRent: prop?.units[0]?.rentAmount?.toString() || ''
    }))
  }

  const handleUnitChange = (unitId: string) => {
    const unit = availableUnits.find(u => u.id === unitId)
    setFormData(prev => ({
      ...prev,
      unitId,
      monthlyRent: unit?.rentAmount?.toString() || ''
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
      const payload = {
        ...formData,
        monthlyRent: formData.monthlyRent ? Number(formData.monthlyRent) : 0,
        securityDeposit: formData.securityDeposit ? Number(formData.securityDeposit) : 0,
      }
      const response = await fetch('/api/landlord/tenants/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
    if (isInviteAdvanced && inviteScope === 'unit' && !inviteUnitId) {
      toast.error('Please select a unit')
      return
    }

    try {
      setLoading(true)
      const payload = {
        mode: isInviteAdvanced ? inviteScope : 'property',
        applicationType: isInviteAdvanced ? inviteAppType : 'existing_tenant',
        propertyId: inviteData.propertyId,
        unitId: (isInviteAdvanced && inviteScope === 'unit') ? inviteUnitId : null,
        requiredRequirements: (isInviteAdvanced && inviteAppType === 'online') ? inviteRequirements : undefined,
        expiresAt: inviteData.expiresAt ? new Date(inviteData.expiresAt).toISOString() : null,
      }

      const response = await fetch('/api/landlord/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok || !data.invite) {
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

  const handleStartWalkIn = () => {
    if (!walkInUnitId) {
      toast.error('Please select a vacant unit for walk-in')
      return
    }

    if (onOpenWalkIn) {
      onOpenWalkIn(walkInPropertyId, walkInUnitId)
      onClose()
    } else {
      setIsInternalWalkInOpen(true)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  if (!isOpen) return null

  const isSuccess = successData || inviteResult

  return (
    <>
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
            className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] neumorphic-panel shadow-2xl"
          >
            {!isSuccess ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 neumorphic-inset px-8 pt-6 pb-2">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight text-foreground">Onboard Residents</h2>
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                      Choose an onboarding mode to get started
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    aria-label="Close modal"
                    className="rounded-2xl neumorphic-inset p-3 text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {/* 3 Modes Tabs */}
                <div className="flex flex-wrap gap-1 border-b border-white/5 neumorphic-inset px-6 sm:px-8 py-3">
                  {[
                    { id: 'quick_add', label: 'Quick Add', icon: UserPlus },
                    { id: 'invite', label: 'Invite Link', icon: LinkIcon },
                    { id: 'walk_in', label: 'Walk-in Application', icon: DoorOpen },
                  ].map((tab) => {
                    const isSelected = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as 'quick_add' | 'invite' | 'walk_in')}
                        className={cn(
                          "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all",
                          isSelected 
                            ? "bg-foreground text-background shadow-xs" 
                            : "text-muted-foreground hover:neumorphic-inset hover:text-foreground"
                        )}
                      >
                        <tab.icon className="size-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-6 sm:p-8">
                  {/* Mode 1: Quick Add */}
                  {activeTab === 'quick_add' && (
                    <form onSubmit={handleSubmit}>
                      <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs font-medium text-muted-foreground">
                        <span className="font-bold text-foreground">Quick Add Mode:</span> Best for existing properties and residents already occupying units before using iReside.
                      </div>

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
                                className="w-full rounded-2xl neumorphic-inset py-3.5 pl-12 pr-5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
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
                                className="w-full rounded-2xl neumorphic-inset py-3.5 pl-12 pr-5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
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
                                className="w-full rounded-2xl neumorphic-inset py-3.5 pl-12 pr-5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
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
                                className="w-full appearance-none rounded-2xl neumorphic-inset py-3.5 pl-12 pr-5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
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
                                className="w-full appearance-none rounded-2xl neumorphic-inset py-3.5 pl-12 pr-5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
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
                                className="w-full rounded-2xl neumorphic-inset px-5 py-3.5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
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
                                className="w-full rounded-2xl neumorphic-inset px-5 py-3.5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label htmlFor="monthlyRent" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Monthly Rent</label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground/60">₱</span>
                                <input
                                  id="monthlyRent"
                                  required
                                  type="number"
                                  value={formData.monthlyRent}
                                  onChange={(e) => setFormData(prev => ({ ...prev, monthlyRent: e.target.value }))}
                                  className="w-full rounded-2xl neumorphic-inset py-3.5 pl-8 pr-5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="securityDeposit" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Security Deposit</label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground/60">₱</span>
                                <input
                                  id="securityDeposit"
                                  type="number"
                                  value={formData.securityDeposit}
                                  onChange={(e) => setFormData(prev => ({ ...prev, securityDeposit: e.target.value }))}
                                  className="w-full rounded-2xl neumorphic-inset py-3.5 pl-8 pr-5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-10 flex gap-4">
                        <button
                          type="button"
                          onClick={onClose}
                          className="flex-1 rounded-2xl neumorphic-inset py-4 text-sm font-black transition-all hover:neumorphic-inset"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-[2] rounded-2xl neumorphic-primary py-4 text-sm font-black shadow-2xl shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                        >
                          {loading ? (
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="size-4 animate-spin" />
                              <span>Registering Resident…</span>
                            </div>
                          ) : 'Register Resident'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Mode 2: Invite Link */}
                  {activeTab === 'invite' && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[2rem] border border-primary/20 bg-primary/5 p-5">
                        <div className="space-y-1">
                          <h3 className="text-base font-black text-foreground">Self-Onboarding Link</h3>
                          <p className="text-xs text-muted-foreground">
                            {isInviteAdvanced ? "Advanced mode: customize unit scope, screening mode, and document uploads." : "Simple mode: generate a shareable link or QR code instantly."}
                          </p>
                        </div>
                        <div className="inline-flex self-start sm:self-auto rounded-xl border border-border bg-background/80 p-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsInviteAdvanced(false);
                              setInviteScope('property');
                              setInviteUnitId('');
                            }}
                            className={cn(
                              "rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-colors",
                              !isInviteAdvanced ? "bg-foreground text-background shadow-xs" : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            Simple
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsInviteAdvanced(true)}
                            className={cn(
                              "rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-colors",
                              isInviteAdvanced ? "bg-foreground text-background shadow-xs" : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            Advanced
                          </button>
                        </div>
                      </div>

                      {/* Advanced Settings */}
                      {isInviteAdvanced && (
                        <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4 sm:p-5 animate-in fade-in duration-200">
                          {/* Scope */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Invite Scope</label>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setInviteScope('property');
                                  setInviteUnitId('');
                                }}
                                className={cn(
                                  "rounded-xl border p-3 text-left transition-all",
                                  inviteScope === 'property'
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-background text-muted-foreground hover:bg-muted/40"
                                )}
                              >
                                <Building2 className="size-4 mb-1" />
                                <p className="text-xs font-bold">Property Wide</p>
                                <p className="text-[10px] opacity-70">Any vacant unit</p>
                              </button>
                              <button
                                type="button"
                                onClick={() => setInviteScope('unit')}
                                className={cn(
                                  "rounded-xl border p-3 text-left transition-all",
                                  inviteScope === 'unit'
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-background text-muted-foreground hover:bg-muted/40"
                                )}
                              >
                                <DoorOpen className="size-4 mb-1" />
                                <p className="text-xs font-bold">Specific Unit</p>
                                <p className="text-[10px] opacity-70">Targeted unit</p>
                              </button>
                            </div>
                          </div>

                          {/* Application Type */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Screening Mode</label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { key: 'existing_tenant' as const, label: 'Existing Resident', desc: 'Pre-existing lease' },
                                { key: 'face_to_face' as const, label: 'In-Person', desc: 'Physical check' },
                                { key: 'online' as const, label: 'Online App', desc: 'Upload documents' },
                              ].map((type) => (
                                <button
                                  key={type.key}
                                  type="button"
                                  onClick={() => setInviteAppType(type.key)}
                                  className={cn(
                                    "rounded-xl border p-2.5 text-left transition-all",
                                    inviteAppType === type.key
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-border bg-background text-muted-foreground hover:bg-muted/40"
                                  )}
                                >
                                  <p className="text-xs font-bold">{type.label}</p>
                                  <p className="text-[9px] opacity-70 leading-tight">{type.desc}</p>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Document Requirements if Online */}
                          {inviteAppType === 'online' && (
                            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Required Documents</p>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  { key: 'valid_id', label: 'Government ID' },
                                  { key: 'proof_of_income', label: 'Proof of Income' },
                                  { key: 'nbi_clearance', label: 'NBI / Police Clearance' },
                                  { key: 'barangay_clearance', label: 'Barangay Clearance' },
                                ].map((doc) => {
                                  const checked = inviteRequirements.includes(doc.key)
                                  return (
                                    <button
                                      key={doc.key}
                                      type="button"
                                      onClick={() => {
                                        setInviteRequirements(prev =>
                                          prev.includes(doc.key) ? prev.filter(k => k !== doc.key) : [...prev, doc.key]
                                        )
                                      }}
                                      className={cn(
                                        "rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition-colors",
                                        checked ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"
                                      )}
                                    >
                                      {doc.label}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Property & Unit Form */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="invitePropertyId" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Target Property</label>
                          <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
                            <select
                              id="invitePropertyId"
                              required
                              value={inviteData.propertyId}
                              onChange={(e) => {
                                const pId = e.target.value
                                setInviteData(prev => ({ ...prev, propertyId: pId }))
                                setInviteUnitId('')
                              }}
                              className="w-full appearance-none rounded-2xl neumorphic-inset py-3.5 pl-12 pr-5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                            >
                              <option value="" disabled>Select Property</option>
                              {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {isInviteAdvanced && inviteScope === 'unit' && (
                          <div className="space-y-2 animate-in fade-in duration-200">
                            <label htmlFor="inviteUnitId" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Target Vacant Unit</label>
                            <div className="relative">
                              <DoorOpen className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
                              <select
                                id="inviteUnitId"
                                required
                                value={inviteUnitId}
                                onChange={(e) => setInviteUnitId(e.target.value)}
                                className="w-full appearance-none rounded-2xl neumorphic-inset py-3.5 pl-12 pr-5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                              >
                                <option value="" disabled>Select Unit</option>
                                {availableUnits.map(u => (
                                  <option key={u.id} value={u.id}>{u.name} (₱{Number(u.rentAmount || 0).toLocaleString()})</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <label htmlFor="expiresAt" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Expiration (Optional)</label>
                          <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
                            <input
                              id="expiresAt"
                              type="date"
                              value={inviteData.expiresAt}
                              onChange={(e) => {
                                setInviteData(prev => ({ ...prev, expiresAt: e.target.value }))
                                setInvitePreset(null)
                              }}
                              className="w-full rounded-2xl neumorphic-inset py-3.5 pl-12 pr-5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                            />
                          </div>
                          <div className="flex gap-2 pt-1">
                            {[
                              { label: '+1 Day', days: 1 },
                              { label: '+7 Days', days: 7 },
                              { label: '+30 Days', days: 30 },
                            ].map((preset) => (
                              <button
                                key={preset.days}
                                type="button"
                                onClick={() => {
                                  const d = new Date()
                                  d.setDate(d.getDate() + preset.days)
                                  const tz = d.getTimezoneOffset() * 60000
                                  setInviteData(prev => ({ ...prev, expiresAt: new Date(d.getTime() - tz).toISOString().slice(0, 10) }))
                                  setInvitePreset(preset.days)
                                }}
                                className={cn(
                                  "rounded-lg border px-2.5 py-1 text-xs font-bold transition-all",
                                  invitePreset === preset.days
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-background text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                )}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <button
                          type="button"
                          onClick={onClose}
                          className="flex-1 rounded-2xl neumorphic-inset py-4 text-sm font-black transition-all hover:neumorphic-inset"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleGenerateInvite}
                          disabled={loading}
                          className="flex-[2] rounded-2xl neumorphic-primary py-4 text-sm font-black shadow-2xl shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                        >
                          {loading ? (
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="size-4 animate-spin" />
                              <span>Generating Link…</span>
                            </div>
                          ) : 'Generate Onboarding Link'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Mode 3: Walk-in Application */}
                  {activeTab === 'walk_in' && (
                    <div className="space-y-6">
                      <div className="rounded-[2rem] border border-primary/20 bg-primary/5 p-5 text-center">
                        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <DoorOpen className="size-6" />
                        </div>
                        <h3 className="text-lg font-black text-foreground">In-Person Walk-in Application</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Intake prospective tenants visiting on-site with live verification, digital lease signing, and payment recording.
                        </p>
                      </div>

                      {/* 4-Step Intake Process Preview */}
                      <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 sm:p-5 space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                          4-Step Intake Process
                        </p>
                        <div className="grid gap-2.5 sm:grid-cols-2">
                          <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-background/60 p-2.5 text-xs">
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">1</span>
                            <div>
                              <p className="font-bold text-foreground">Applicant Details</p>
                              <p className="text-[11px] text-muted-foreground">Identity, employment & contact info</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-background/60 p-2.5 text-xs">
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">2</span>
                            <div>
                              <p className="font-bold text-foreground">Requirements Check</p>
                              <p className="text-[11px] text-muted-foreground">Verify physical IDs & income proof</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-background/60 p-2.5 text-xs">
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">3</span>
                            <div>
                              <p className="font-bold text-foreground">Digital Lease Signing</p>
                              <p className="text-[11px] text-muted-foreground">Sign agreement on screen or print</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-background/60 p-2.5 text-xs">
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">4</span>
                            <div>
                              <p className="font-bold text-foreground">Payment & Move-In</p>
                              <p className="text-[11px] text-muted-foreground">Record downpayment & set occupied</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Property & Unit Selector */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label htmlFor="walkInPropertyId" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                            Target Property
                          </label>
                          <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
                            <select
                              id="walkInPropertyId"
                              value={walkInPropertyId}
                              onChange={(e) => {
                                const pId = e.target.value
                                setWalkInPropertyId(pId)
                                const prop = properties.find(p => p.id === pId)
                                const vacant = (prop?.units || []).find(u => (u.status ?? 'vacant') === 'vacant')
                                setWalkInUnitId(vacant?.id || prop?.units[0]?.id || '')
                              }}
                              className="w-full appearance-none rounded-2xl neumorphic-inset py-3.5 pl-12 pr-5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                            >
                              <option value="" disabled>Select Property</option>
                              {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="walkInUnitId" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                            Target Vacant Unit
                          </label>
                          <div className="relative">
                            <DoorOpen className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
                            <select
                              id="walkInUnitId"
                              value={walkInUnitId}
                              onChange={(e) => setWalkInUnitId(e.target.value)}
                              disabled={walkInAvailableUnits.length === 0}
                              className="w-full appearance-none rounded-2xl neumorphic-inset py-3.5 pl-12 pr-5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4 disabled:opacity-50"
                            >
                              <option value="" disabled>
                                {walkInAvailableUnits.length === 0 ? "No vacant units available" : "Select Vacant Unit"}
                              </option>
                              {walkInAvailableUnits.map(u => (
                                <option key={u.id} value={u.id}>
                                  {u.name} (₱{Number(u.rentAmount || 0).toLocaleString()}/mo)
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-4 pt-2">
                        <button
                          type="button"
                          onClick={onClose}
                          className="flex-1 rounded-2xl neumorphic-inset py-4 text-sm font-black transition-all hover:neumorphic-inset"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleStartWalkIn}
                          disabled={!walkInUnitId}
                          className="flex-[2] inline-flex items-center justify-center gap-2 rounded-2xl neumorphic-primary py-4 text-sm font-black shadow-2xl shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                        >
                          <span>Start Walk-in Application</span>
                          <ArrowRight className="size-4" />
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
                      <div className="mt-8 rounded-[2rem] neumorphic-inset p-8">
                        <div className="mb-4 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                          <AlertCircle className="size-4" />
                          <span>Temporary Credentials</span>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between rounded-2xl bg-background p-4">
                            <div className="text-left">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Email</p>
                              <p className="text-sm font-black text-foreground">{successData.email}</p>
                            </div>
                            <button onClick={() => copyToClipboard(successData.email)} className="p-2 text-muted-foreground hover:text-primary">
                              <Copy className="size-4" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between rounded-2xl bg-background p-4">
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
                      <div className="mt-8 rounded-[2rem] bg-emerald-500/5 p-8 text-emerald-600">
                        <p className="text-sm font-black">This email is already registered on iReside. The resident can log in using their existing credentials.</p>
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
                      <div className="flex items-center justify-center rounded-3xl neumorphic-inset p-6">
                        <div className="relative size-48 overflow-hidden rounded-2xl">
                          <Image 
                            src={inviteResult.qrUrl} 
                            alt="QR Code" 
                            fill
                            sizes="192px"
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl neumorphic-inset p-4">
                        <div className="text-left truncate max-w-[300px]">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Onboarding URL</p>
                          <p className="text-sm font-black text-foreground truncate">{inviteResult.shareUrl}</p>
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

      {/* Internal Walk-in Modal Fallback if not handled by parent */}
      {isInternalWalkInOpen && (
        <WalkInApplicationModal
          isOpen={isInternalWalkInOpen}
          onClose={() => setIsInternalWalkInOpen(false)}
          units={allWalkInUnits}
          selectedUnitId={walkInUnitId}
          onSuccess={() => {
            setIsInternalWalkInOpen(false)
            void refreshProperties()
            onSuccess()
            onClose()
          }}
        />
      )}
    </>
  )
}
