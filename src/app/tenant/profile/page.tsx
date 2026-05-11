import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Home,
    CheckCircle2,
    TrendingUp,
    MessageSquare,
    ShieldCheck,
    Star,
    Zap,
    Check,
    Clock,
    ArrowRight,
    Map as MapIcon,
    Building2,
    Calendar
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

import EditableBio from '@/components/landlord/EditableBio';
import { ProfileAvatarUploader } from '@/components/profile/ProfileAvatarUploader';
import { ProfileCoverUploader } from '@/components/profile/ProfileCoverUploader';
import { RoleBadge } from '@/components/profile/RoleBadge';
import { SocialsHeader } from '@/components/profile/SocialsHeader';
import { ClientOnlyDate, ClientOnlyYear } from '@/components/ui/client-only-date';

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

function formatRelativeDate(value: string) {
    const date = new Date(value);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (Number.isNaN(diffMs) || diffMs < 0) {
        return 'Recently';
    }

    const day = 24 * 60 * 60 * 1000;
    const week = 7 * day;
    const month = 30 * day;

    if (diffMs < day) {
        return 'Today';
    }

    if (diffMs < week) {
        return `${Math.floor(diffMs / day)} day${Math.floor(diffMs / day) === 1 ? '' : 's'} ago`;
    }

    if (diffMs < month) {
        return `${Math.floor(diffMs / week)} week${Math.floor(diffMs / week) === 1 ? '' : 's'} ago`;
    }

    return `${Math.floor(diffMs / month)} month${Math.floor(diffMs / month) === 1 ? '' : 's'} ago`;
}

function resolveGoogleAvatarUrl(user: { user_metadata?: Record<string, unknown> | null; identities?: Array<{ identity_data?: Record<string, unknown> | null }> | null }) {
    const metadataAvatar = typeof user.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : null;
    if (metadataAvatar && metadataAvatar.trim().length > 0) {
        return metadataAvatar;
    }

    const metadataPicture = typeof user.user_metadata?.picture === 'string' ? user.user_metadata.picture : null;
    if (metadataPicture && metadataPicture.trim().length > 0) {
        return metadataPicture;
    }

    for (const identity of user.identities ?? []) {
        const identityData = identity.identity_data;
        const providerAvatar = typeof identityData?.avatar_url === 'string' ? identityData.avatar_url : null;
        if (providerAvatar && providerAvatar.trim().length > 0) {
            return providerAvatar;
        }

        const providerPicture = typeof identityData?.picture === 'string' ? identityData.picture : null;
        if (providerPicture && providerPicture.trim().length > 0) {
            return providerPicture;
        }
    }

    return null;
}

export default async function TenantProfilePage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch profile and leases
    const [profileRes, leasesRes] = await Promise.all([
        supabase
            .from('profiles')
            .select('id, full_name, email, role, avatar_url, avatar_bg_color, phone, bio, website, address, created_at, cover_url, socials')
            .eq('id', user.id)
            .maybeSingle(),
        supabase
            .from('leases')
            .select('*, units(*, properties(*))')
            .eq('tenant_id', user.id)
            .order('start_date', { ascending: false })
    ]);

    const profile = profileRes.data;
    if (!profile) {
        redirect('/login');
    }

    const leases = leasesRes.data || [];
    const activeLease = leases.find(l => l.status === 'active');
    const pastLeases = leases.filter(l => l.status !== 'active' && l.status !== 'draft');

    const googleAvatarUrl = resolveGoogleAvatarUrl(user);
    const profileAvatarUrl = profile.avatar_url ?? googleAvatarUrl;
    const socials = (profile.socials as Record<string, string>) || {};

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 p-6 md:p-12">
            <div className="mx-auto max-w-5xl space-y-8">
                {/* Profile Header Card */}
                <div className="relative bg-[#171717]/80 border border-neutral-800 rounded-[3rem] overflow-hidden backdrop-blur-xl shadow-2xl flex flex-col items-center">
                    {/* Cover Image Container */}
                    <div className="relative h-64 md:h-80 w-full group">
                        <ProfileCoverUploader 
                            initialCoverUrl={profile.cover_url} 
                            fullName={profile.full_name} 
                        />
                    </div>

                    {/* Profile Content Section */}
                    <div className="relative w-full px-8 pb-12 -mt-16 md:-mt-24 flex flex-col items-center text-center">
                        {/* Overlapping Avatar */}
                        <div className="relative size-32 md:w-44 md:h-44 mb-6 z-20">
                            <ProfileAvatarUploader 
                                initialAvatarUrl={profileAvatarUrl} 
                                avatarBgColor={profile.avatar_bg_color} 
                                fullName={profile.full_name} 
                                className="w-full h-full shadow-2xl"
                            />
                        </div>

                        {/* Name & Badge Area */}
                        <div className="space-y-3 mb-8">
                            <div className="flex items-center justify-center gap-4">
                                <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">
                                    {profile.full_name}
                                </h1>
                            </div>
                            <div className="flex items-center justify-center gap-3">
                                <RoleBadge role={profile.role} className="scale-110" showTenant={true} />
                                <span className="text-[10px] font-bold tracking-widest uppercase text-[#6d9838]">Verified Tenant</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4 mb-12">
                            <Link
                                href="/tenant/settings"
                                className="px-10 py-3 rounded-2xl bg-white text-black font-bold text-[11px] tracking-widest uppercase transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-white/5"
                            >
                                Edit Profile
                            </Link>
                            <Link
                                href="/tenant/messages"
                                className="size-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-md flex items-center justify-center transition-all duration-300"
                            >
                                <MessageSquare size={20} />
                            </Link>
                        </div>

                        {/* Contact Info Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 pt-10 border-t border-white/5 w-full max-w-4xl">
                            <div className="flex flex-col items-center gap-2 group/item transition-all text-center">
                                <div className="size-10 rounded-full bg-[#6d9838]/10 flex items-center justify-center border border-[#6d9838]/20 group-hover/item:scale-110 transition-transform">
                                    <Mail size={18} className="text-[#6d9838]" />
                                </div>
                                <p className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase">Email Address</p>
                                <a href={`mailto:${profile.email}`} className="text-sm text-white/90 font-medium hover:text-[#6d9838] transition-colors">{profile.email}</a>
                            </div>
                            <div className="flex flex-col items-center gap-2 group/item transition-all text-center">
                                <div className="size-10 rounded-full bg-[#6d9838]/10 flex items-center justify-center border border-[#6d9838]/20 group-hover/item:scale-110 transition-transform">
                                    <Phone size={18} className="text-[#6d9838]" />
                                </div>
                                <p className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase">Phone Number</p>
                                <a href={`tel:${profile.phone}`} className="text-sm text-white/90 font-medium hover:text-[#6d9838] transition-colors">{profile.phone || '+63 (---) --- ----'}</a>
                            </div>
                            <div className="flex flex-col items-center gap-2 group/item transition-all text-center">
                                <div className="size-10 rounded-full bg-[#6d9838]/10 flex items-center justify-center border border-[#6d9838]/20 group-hover/item:scale-110 transition-transform">
                                    <MapPin size={18} className="text-[#6d9838]" />
                                </div>
                                <p className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase">Primary Location</p>
                                <p className="text-sm text-white/90 font-medium">{profile.address || 'Metro Manila, PH'}</p>
                            </div>
                        </div>

                        {/* Social Connectivity Row */}
                        <SocialsHeader userId={profile.id} initialSocials={socials} />
                    </div>
                </div>

                {/* Bio Section */}
                <div className="bg-[#171717]/80 border border-neutral-800 rounded-[3rem] p-12 backdrop-blur-xl shadow-xl">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="size-12 rounded-2xl bg-[#6d9838]/10 flex items-center justify-center border border-[#6d9838]/20">
                            <User size={20} className="text-[#6d9838]" />
                        </div>
                        <h2 className="text-2xl font-display font-bold text-white tracking-tight">Biography</h2>
                    </div>
                    <div className="max-w-4xl">
                        <EditableBio initialBio={profile.bio || ''} />
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
                            <h2 className="text-2xl font-display font-bold text-white tracking-tight">Current Residency</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase mb-2">Property & Unit</p>
                                    <h3 className="text-3xl font-display font-bold text-white">
                                        {activeLease.units?.properties?.name}
                                        <span className="block text-xl text-[#6d9838] mt-1">
                                            {activeLease.units?.name}
                                        </span>
                                    </h3>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex-1">
                                        <p className="text-[9px] font-bold tracking-widest text-neutral-500 uppercase mb-1">Monthly Rent</p>
                                        <p className="text-xl font-bold text-white">{formatCurrency(activeLease.monthly_rent)}</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex-1">
                                        <p className="text-[9px] font-bold tracking-widest text-neutral-500 uppercase mb-1">Status</p>
                                        <div className="flex items-center gap-2">
                                            <div className="size-2 rounded-full bg-[#6d9838] animate-pulse" />
                                            <p className="text-xl font-bold text-white uppercase tracking-tighter">Active</p>
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
                                            <p className="text-sm font-bold text-white">
                                                <ClientOnlyDate date={activeLease.start_date} format={{ month: 'short', year: '2-digit' }} /> — <ClientOnlyDate date={activeLease.end_date} format={{ month: 'short', year: '2-digit' }} />
                                            </p>
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#6d9838] rounded-full transition-all duration-500"
                                            style={{ width: `${calculateLeaseProgress(activeLease.start_date, activeLease.end_date)}%` }}
                                        />
                                    </div>
                                </div>
                                <Link 
                                    href={`/tenant/leases/${activeLease.id}`}
                                    className="mt-8 flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[11px] tracking-widest uppercase transition-all"
                                >
                                    View Lease Details <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#171717]/80 border border-neutral-800 border-dashed rounded-[3rem] p-12 backdrop-blur-xl flex flex-col items-center justify-center text-center">
                        <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                            <Home size={24} className="text-neutral-600" />
                        </div>
                        <h2 className="text-xl font-display font-bold text-white mb-2">No Active Residency</h2>
                        <p className="text-neutral-500 max-w-sm mb-8">You don&apos;t have any active leases at the moment. Start exploring properties to find your next home.</p>
                        <Link 
                            href="/tenant/explore"
                            className="px-8 py-3 rounded-xl bg-[#6d9838] text-white font-bold text-[11px] tracking-widest uppercase transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#6d9838]/20"
                        >
                            Explore Properties
                        </Link>
                    </div>
                )}

                {/* Journey History Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-[#6d9838]/10 flex items-center justify-center border border-[#6d9838]/20">
                                <Clock size={20} className="text-[#6d9838]" />
                            </div>
                            <h2 className="text-2xl font-display font-bold text-white tracking-tight">Tenancy Journey</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pastLeases.length > 0 ? (
                            pastLeases.map((lease) => (
                                <div key={lease.id} className="group bg-[#171717]/80 border border-neutral-800 rounded-[2.5rem] overflow-hidden backdrop-blur-xl transition-all duration-500 hover:border-[#6d9838]/50 hover:shadow-2xl hover:shadow-[#6d9838]/5">
                                    <div className="relative h-48 w-full overflow-hidden">
                                        <Image
                                            src={lease.units?.properties?.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=800&auto=format&fit=crop'}
                                            alt={lease.units?.properties?.name || 'Property'}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 350px"
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#171717] via-transparent to-transparent" />
                                        <div className="absolute top-4 left-4">
                                            <span className="bg-black/40 backdrop-blur-md text-white border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                                                <ClientOnlyYear date={lease.start_date} /> — <ClientOnlyYear date={lease.end_date} />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <h4 className="text-xl font-display font-bold text-white group-hover:text-[#6d9838] transition-colors">{lease.units?.properties?.name}</h4>
                                            <p className="text-sm text-neutral-500 flex items-center gap-2 mt-1">
                                                <MapIcon size={12} /> {lease.units?.properties?.city}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <div>
                                                <p className="text-[9px] font-bold tracking-widest text-neutral-600 uppercase">Monthly Rent</p>
                                                <p className="text-sm font-bold text-white">{formatCurrency(lease.monthly_rent)}</p>
                                            </div>
                                            <Link 
                                                href={`/tenant/leases/${lease.id}`}
                                                className="size-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-[#6d9838] hover:text-white transition-all"
                                            >
                                                <ArrowRight size={16} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full bg-[#171717]/40 border border-neutral-800 border-dashed rounded-[2.5rem] p-12 text-center">
                                <p className="text-neutral-500 italic">No past residencies recorded yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
