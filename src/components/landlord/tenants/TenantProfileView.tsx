'use client'

import { useState, useEffect } from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Home,
    User,
    Calendar,
    Building2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { RoleBadge } from '@/components/profile/RoleBadge'
import { ReadOnlyAvatar } from '@/components/profile/ReadOnlyAvatar'
import { ReadOnlyCover } from '@/components/profile/ReadOnlyCover'
import { ReadOnlySocials } from '@/components/profile/ReadOnlySocials'
import EditableBio from '@/components/landlord/EditableBio'
import { ClientOnlyDate } from '@/components/ui/client-only-date'

interface TenantProfileViewProps {
    tenantId: string
    onClose: () => void
}

type TenantProfile = {
    id: string
    full_name: string
    email: string
    role: string
    avatar_url: string | null
    avatar_bg_color: string | null
    phone: string | null
    bio: string | null
    website: string | null
    address: string | null
    cover_url: string | null
    socials: Record<string, string> | null
    created_at: string
}

type LeaseInfo = {
    id: string
    status: string
    start_date: string
    end_date: string
    monthly_rent: number
    unit: {
        id: string
        name: string
        property: {
            id: string
            name: string
            address: string
            city: string
        }
    }
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0,
    }).format(amount);
}

function calculateLeaseProgress(startDate: string, endDate: string): number {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = Date.now();

    if (now <= start) return 0;
    if (now >= end) return 100;

    const total = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / total) * 100);
}

export function TenantProfileView({ tenantId, onClose }: TenantProfileViewProps) {
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<TenantProfile | null>(null)
    const [activeLease, setActiveLease] = useState<LeaseInfo | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true)
            setError(null)
            try {
                const response = await fetch(`/api/landlord/tenants/${tenantId}/profile`)

                if (!response.ok) {
                    setError('Profile not found')
                    setLoading(false)
                    return
                }

                const data = await response.json()
                setProfile(data.profile)
                setActiveLease(data.activeLease)
            } catch (err) {
                console.error('Error fetching tenant profile:', err)
                setError('Failed to load profile')
                toast.error('Failed to load profile')
            } finally {
                setLoading(false)
            }
        }

        if (tenantId) {
            fetchProfile()
        }
    }, [tenantId])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 p-6 md:p-12">
                <div className="mx-auto max-w-5xl flex items-center justify-center py-20">
                    <div className="size-8 animate-spin rounded-full border-2 border-[#6d9838]/20 border-t-[#6d9838]" />
                </div>
            </div>
        )
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 p-6 md:p-12">
                <div className="mx-auto max-w-5xl">
                    <button
                        onClick={onClose}
                        className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-black text-neutral-400 hover:text-white transition-all mb-8"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Tenants
                    </button>
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <p className="text-neutral-400">Failed to load profile</p>
                    </div>
                </div>
            </div>
        )
    }

    const socials = profile.socials || {}
    const leaseProgress = activeLease
        ? calculateLeaseProgress(activeLease.start_date, activeLease.end_date)
        : 0

    return (
        <LazyMotion features={domAnimation}>
            <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="min-h-screen bg-[#0a0a0a] text-neutral-200 p-6 md:p-12"
            >
                <div className="mx-auto max-w-5xl space-y-8">
                    {/* Back Button */}
                    <button
                        onClick={onClose}
                        className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-black text-neutral-400 hover:text-white transition-all"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Tenants
                    </button>

                    {/* Profile Header Card */}
                    <div className="relative bg-[#171717]/80 border border-neutral-800 rounded-[3rem] overflow-hidden backdrop-blur-xl shadow-2xl flex flex-col items-center">
                        {/* Cover Image Container */}
                        <div className="relative h-64 md:h-80 w-full">
                            <ReadOnlyCover
                                coverUrl={profile.cover_url}
                                fullName={profile.full_name}
                                className="w-full h-full"
                            />
                        </div>

                        {/* Profile Content Section */}
                        <div className="relative w-full px-8 pb-12 -mt-16 md:-mt-24 flex flex-col items-center text-center">
                            {/* Overlapping Avatar */}
                            <div className="relative size-32 md:w-44 md:h-44 mb-6 z-20">
                                <ReadOnlyAvatar
                                    avatarUrl={profile.avatar_url}
                                    avatarBgColor={profile.avatar_bg_color}
                                    fullName={profile.full_name}
                                    size={176}
                                    className="w-full h-full shadow-2xl"
                                />
                            </div>

                            {/* Name & Badge Area */}
                            <div className="space-y-3 mb-8">
                                <div className="flex items-center justify-center gap-4">
                                    <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tight">
                                        {profile.full_name}
                                    </h1>
                                </div>
                                <div className="flex items-center justify-center gap-3">
                                    <RoleBadge role={profile.role as 'tenant' | 'landlord' | 'admin'} className="scale-110" showTenant={true} />
                                    <span className="text-[10px] font-black tracking-widest uppercase text-[#6d9838]">Verified Tenant</span>
                                </div>
                            </div>

                            {/* Contact Info Row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 pt-10 border-t border-white/5 w-full max-w-4xl">
                                <div className="flex flex-col items-center gap-2 group/item transition-all text-center">
                                    <div className="size-10 rounded-full bg-[#6d9838]/10 flex items-center justify-center border border-[#6d9838]/20 group-hover/item:scale-110 transition-transform">
                                        <Mail size={18} className="text-[#6d9838]" />
                                    </div>
                                    <p className="text-[10px] font-black tracking-widest text-neutral-500 uppercase">Email Address</p>
                                    <a href={`mailto:${profile.email}`} className="text-sm text-white/90 font-medium hover:text-[#6d9838] transition-colors">{profile.email}</a>
                                </div>
                                <div className="flex flex-col items-center gap-2 group/item transition-all text-center">
                                    <div className="size-10 rounded-full bg-[#6d9838]/10 flex items-center justify-center border border-[#6d9838]/20 group-hover/item:scale-110 transition-transform">
                                        <Phone size={18} className="text-[#6d9838]" />
                                    </div>
                                    <p className="text-[10px] font-black tracking-widest text-neutral-500 uppercase">Phone Number</p>
                                    <a href={`tel:${profile.phone}`} className="text-sm text-white/90 font-medium hover:text-[#6d9838] transition-colors">{profile.phone || '+63 (---) --- ----'}</a>
                                </div>
                                <div className="flex flex-col items-center gap-2 group/item transition-all text-center">
                                    <div className="size-10 rounded-full bg-[#6d9838]/10 flex items-center justify-center border border-[#6d9838]/20 group-hover/item:scale-110 transition-transform">
                                        <MapPin size={18} className="text-[#6d9838]" />
                                    </div>
                                    <p className="text-[10px] font-black tracking-widest text-neutral-500 uppercase">Primary Location</p>
                                    <p className="text-sm text-white/90 font-medium">{profile.address || 'Metro Manila, PH'}</p>
                                </div>
                            </div>

                            {/* Social Connectivity Row */}
                            <ReadOnlySocials socials={socials} className="mt-0" />
                        </div>
                    </div>

                    {/* Bio Section */}
                    <div className="bg-[#171717]/80 border border-neutral-800 rounded-[3rem] p-12 backdrop-blur-xl shadow-xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="size-12 rounded-2xl bg-[#6d9838]/10 flex items-center justify-center border border-[#6d9838]/20">
                                <User size={20} className="text-[#6d9838]" />
                            </div>
                            <h2 className="text-2xl font-display font-black text-white tracking-tight">Biography</h2>
                        </div>
                        <div className="max-w-4xl">
                            <EditableBio initialBio={profile.bio || ''} isOwner={false} />
                        </div>
                    </div>

                    {/* Active Residency Section */}
                    {activeLease ? (
                        <div className="bg-[#171717]/80 border border-neutral-800 rounded-[3rem] p-10 backdrop-blur-xl shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-10 opacity-5">
                                <Home size={200} />
                            </div>

                            <div className="flex items-center gap-4 mb-10 relative z-10">
                                <div className="size-12 rounded-2xl bg-[#6d9838]/10 flex items-center justify-center border border-[#6d9838]/20">
                                    <Home size={20} className="text-[#6d9838]" />
                                </div>
                                <h2 className="text-2xl font-display font-black text-white tracking-tight">Current Residency</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-black tracking-widest text-neutral-500 uppercase mb-2">Property & Unit</p>
                                        <h3 className="text-3xl font-display font-black text-white">
                                            {activeLease.unit?.property?.name}
                                            <span className="block text-xl text-[#6d9838] mt-1">
                                                {activeLease.unit?.name}
                                            </span>
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex-1">
                                            <p className="text-[9px] font-black tracking-widest text-neutral-500 uppercase mb-1">Monthly Rent</p>
                                            <p className="text-xl font-black text-white">{formatCurrency(activeLease.monthly_rent)}</p>
                                        </div>
                                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex-1">
                                            <p className="text-[9px] font-black tracking-widest text-neutral-500 uppercase mb-1">Status</p>
                                            <div className="flex items-center gap-2">
                                                <div className="size-2 rounded-full bg-[#6d9838] animate-pulse" />
                                                <p className="text-xl font-black text-white uppercase tracking-tighter">Active</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem] flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Calendar size={16} className="text-[#6d9838]" />
                                                <p className="text-sm text-neutral-400">Lease Period</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white">
                                                    <ClientOnlyDate date={activeLease.start_date} format={{ month: 'short', year: '2-digit' }} /> — <ClientOnlyDate date={activeLease.end_date} format={{ month: 'short', year: '2-digit' }} />
                                                </p>
                                            </div>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#6d9838] rounded-full transition-all duration-500"
                                                style={{ width: `${leaseProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-4">
                                        {leaseProgress}% complete
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#171717]/80 border border-neutral-800 rounded-[3rem] p-10 backdrop-blur-xl shadow-xl">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="size-12 rounded-2xl bg-[#6d9838]/10 flex items-center justify-center border border-[#6d9838]/20">
                                    <Building2 size={20} className="text-[#6d9838]" />
                                </div>
                                <h2 className="text-2xl font-display font-black text-white tracking-tight">Current Residency</h2>
                            </div>
                            <p className="text-neutral-500">No active lease found.</p>
                        </div>
                    )}
                </div>
            </m.div>
        </LazyMotion>
    )
}