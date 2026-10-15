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
 Building2,
 MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { RoleBadge } from '@/components/profile/RoleBadge'
import { ReadOnlyAvatar } from '@/components/profile/ReadOnlyAvatar'
import { ReadOnlyCover } from '@/components/profile/ReadOnlyCover'
import { ReadOnlySocials } from '@/components/profile/ReadOnlySocials'
import EditableBio from '@/components/landlord/EditableBio'
import { ClientOnlyDate } from '@/components/ui/client-only-date'
import { formatTenure, leaseEndState, leaseProgressPercent, leaseTermLabel, tenureSinceLabel } from '@/lib/lease-term'
import { useLanguageContext } from '@/context/LanguageContext'
import { tr } from '@/hooks/useLanguage'
import { formatPhMobile } from "@/lib/phone";

interface TenantProfileViewProps {
 tenantId: string
 onClose: () => void
 onMessage?: (tenantId: string) => void
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
 /** Null for open-ended (month-to-month) leases. */
 end_date: string | null
 term_type?: string | null
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

export function TenantProfileView({ tenantId, onClose, onMessage }: TenantProfileViewProps) {
 const { t, language } = useLanguageContext()
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
 toast.error(tr('Failed to load profile'))
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
			<div className="min-h-screen bg-background text-foreground p-6 md:p-12">
				<div className="mx-auto max-w-5xl flex items-center justify-center py-20">
					<div className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
				</div>
			</div>
		)
	}

	if (error || !profile) {
		return (
			<div className="min-h-screen bg-background text-foreground p-6 md:p-12">
				<div className="mx-auto max-w-5xl">
					<button
						onClick={onClose}
						className="inline-flex items-center gap-2 rounded-xl neumorphic-extruded px-4 py-2 text-sm font-black text-muted-foreground hover:text-foreground transition-all mb-8"
					>
						<ArrowLeft className="size-4" />
						{t("Back to Tenants")}
					</button>
					<div className="flex flex-col items-center justify-center py-20 text-center">
						<p className="text-muted-foreground">{t("Failed to load profile")}</p>
					</div>
				</div>
			</div>
		)
	}

	const socials = profile.socials || {}
	// Null for open-ended leases: those show tenure instead of a progress bar.
	const leaseProgress = activeLease ? leaseProgressPercent(activeLease) : null
	const leaseState = activeLease ? leaseEndState(activeLease) : null
	const leaseIsOpenEnded = leaseState?.kind === 'open_ended'

	return (
		<LazyMotion features={domAnimation}>
			<m.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -20 }}
				className="min-h-screen bg-background text-foreground p-6 md:p-12"
			>
				<div className="mx-auto max-w-5xl space-y-8">
					{/* Back Button */}
					<button
						onClick={onClose}
						className="inline-flex items-center gap-2 rounded-xl neumorphic-extruded px-4 py-2 text-sm font-black text-muted-foreground hover:text-foreground transition-all"
					>
						<ArrowLeft className="size-4" />
						{t("Back to Tenants")}
					</button>

					{/* Profile Header Card */}
					<div className="relative neumorphic-panel rounded-[3rem] overflow-hidden flex flex-col items-center">
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
							<div className="relative size-32 md:w-44 md:h-44 mb-6 z-20 neumorphic-inset-card rounded-full p-2">
								<ReadOnlyAvatar
									avatarUrl={profile.avatar_url}
									avatarBgColor={profile.avatar_bg_color}
									fullName={profile.full_name}
									size={176}
									className="w-full h-full rounded-full"
								/>
							</div>

							{/* Name & Badge Area */}
							<div className="space-y-3 mb-8">
								<div className="flex items-center justify-center gap-4">
									<h1 className="text-4xl md:text-5xl font-display font-black tracking-tight">
										{profile.full_name}
									</h1>
								</div>
								<div className="flex items-center justify-center gap-3">
									<RoleBadge role={profile.role as 'tenant' | 'landlord' | 'admin'} className="scale-110" showTenant={true} />
									<span className="text-[10px] font-black tracking-widest uppercase text-primary">{t("Verified Tenant")}</span>
								</div>
							</div>

							{/* Contact Info Row */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 pt-10 border-t border-black/10 dark:border-white/5 w-full max-w-4xl">
								<div className="flex flex-col items-center gap-2 group/item transition-all text-center">
									<div className="size-12 rounded-full neumorphic-inset-card flex items-center justify-center group-hover/item:scale-110 transition-transform">
										<Mail size={18} className="text-[#c4b0ff]" />
									</div>
									<p className="text-[10px] font-black tracking-widest opacity-50 uppercase mt-2">{t("Email Address")}</p>
									<a href={`mailto:${profile.email}`} className="text-sm font-medium hover:text-primary transition-colors">{profile.email}</a>
								</div>
								<div className="flex flex-col items-center gap-2 group/item transition-all text-center">
									<div className="size-12 rounded-full neumorphic-inset-card flex items-center justify-center group-hover/item:scale-110 transition-transform">
										<Phone size={18} className="text-[#c4b0ff]" />
									</div>
									<p className="text-[10px] font-black tracking-widest opacity-50 uppercase mt-2">{t("Phone Number")}</p>
									<a href={`tel:${profile.phone}`} className="text-sm font-medium hover:text-primary transition-colors">{formatPhMobile(profile.phone) || '+63 (---) --- ----'}</a>
								</div>
								<div className="flex flex-col items-center gap-2 group/item transition-all text-center">
									<div className="size-12 rounded-full neumorphic-inset-card flex items-center justify-center group-hover/item:scale-110 transition-transform">
										<MapPin size={18} className="text-[#c4b0ff]" />
									</div>
									<p className="text-[10px] font-black tracking-widest opacity-50 uppercase mt-2">{t("Primary Location")}</p>
									<p className="text-sm font-medium">{profile.address || 'Metro Manila, PH'}</p>
								</div>
							</div>

							{/* Social Connectivity Row */}
							<ReadOnlySocials socials={socials} className="mt-0" />

							{onMessage && (
								<button
									type="button"
									onClick={() => onMessage(tenantId)}
									className="mt-6 inline-flex items-center gap-2 rounded-xl neumorphic-primary px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer"
								>
									<MessageSquare size={15} />
									<span>{t("Message Resident in Workspace")}</span>
								</button>
							)}
						</div>
					</div>

					{/* Bio Section */}
					<div className="neumorphic-panel rounded-[3rem] p-12">
						<div className="flex items-center gap-4 mb-8">
							<div className="size-12 rounded-2xl neumorphic-inset-card flex items-center justify-center">
								<User size={20} className="text-[#c4b0ff]" />
							</div>
							<h2 className="text-2xl font-display font-black tracking-tight">{t("Bio")}</h2>
						</div>
						<div className="max-w-4xl">
							<EditableBio initialBio={profile.bio || ''} isOwner={false} />
						</div>
					</div>

					{/* Active Residency Section */}
					{activeLease ? (
						<div className="neumorphic-panel rounded-[3rem] p-10 overflow-hidden relative">
							<div className="absolute top-0 right-0 p-10 opacity-5">
								<Home size={200} />
							</div>

							<div className="flex items-center gap-4 mb-10 relative z-10">
								<div className="size-12 rounded-2xl neumorphic-inset-card flex items-center justify-center">
									<Home size={20} className="text-[#c4b0ff]" />
								</div>
								<h2 className="text-2xl font-display font-black tracking-tight">{t("Current Residency")}</h2>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
								<div className="space-y-6">
									<div>
										<p className="text-[10px] font-black tracking-widest opacity-50 uppercase mb-2">{t("Property & Unit")}</p>
										<h3 className="text-3xl font-display font-black">
											{activeLease.unit?.property?.name}
											<span className="block text-xl text-primary mt-1">
												{activeLease.unit?.name}
											</span>
										</h3>
									</div>
									<div className="flex items-center gap-6">
										<div className="neumorphic-inset p-4 rounded-2xl flex-1">
											<p className="text-[9px] font-black tracking-widest opacity-50 uppercase mb-1">{t("Monthly Rent")}</p>
											<p className="text-xl font-black">{formatCurrency(activeLease.monthly_rent)}</p>
										</div>
										<div className="neumorphic-inset p-4 rounded-2xl flex-1">
											<p className="text-[9px] font-black tracking-widest opacity-50 uppercase mb-1">{t("Status")}</p>
											<div className="flex items-center gap-2">
												<div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
												<p className="text-xl font-black uppercase tracking-tighter">{t("Active")}</p>
											</div>
										</div>
									</div>
								</div>

								<div className="neumorphic-inset p-8 rounded-[2rem] flex flex-col justify-between">
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<Calendar size={16} className="text-[#c4b0ff]" />
												<p className="text-sm text-muted-foreground">{t("Lease Period")}</p>
											</div>
											<div>
												<p className="text-sm font-black">
													<ClientOnlyDate date={activeLease.start_date} format={{ month: 'short', year: '2-digit' }} /> — {activeLease.end_date ? <ClientOnlyDate date={activeLease.end_date} format={{ month: 'short', year: '2-digit' }} /> : t('Open-ended')}
												</p>
											</div>
										</div>
										{leaseIsOpenEnded ? (
											<div className="flex items-center justify-between rounded-2xl neumorphic-inset-card px-4 py-3">
												<div>
													<p className="text-[9px] font-black tracking-widest opacity-50 uppercase">{t("Tenure")}</p>
													<p className="text-sm font-black">{formatTenure(activeLease.start_date, undefined, language) || t('Just moved in')}</p>
												</div>
												<p className="text-xs font-bold text-muted-foreground">{tenureSinceLabel(activeLease.start_date, language)}</p>
											</div>
										) : (
											<div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
												<div
													className="h-full bg-primary rounded-full transition-all duration-500"
													style={{ width: `${leaseProgress ?? 0}%` }}
												/>
											</div>
										)}
									</div>
									<p className="text-xs text-muted-foreground mt-4">
										{leaseIsOpenEnded
											? t('Month-to-month. Continues for as long as rent is paid.')
											: t('{percent}% complete · {term}', { percent: leaseProgress ?? 0, term: leaseTermLabel(activeLease, undefined, language) })}
									</p>
								</div>
							</div>
						</div>
					) : (
						<div className="neumorphic-panel border-dashed border-2 rounded-[3rem] p-10">
							<div className="flex items-center gap-4 mb-6">
								<div className="size-12 rounded-2xl neumorphic-inset-card flex items-center justify-center">
									<Building2 size={20} className="text-[#c4b0ff]" />
								</div>
								<h2 className="text-2xl font-display font-black tracking-tight">{t("Current Residency")}</h2>
							</div>
							<p className="text-muted-foreground">{t("No active lease found.")}</p>
						</div>
					)}
				</div>
			</m.div>
		</LazyMotion>
	)
}