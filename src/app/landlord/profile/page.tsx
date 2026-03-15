import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import {
    User,
    MapPin,
    Home,
    CheckCircle2,
    TrendingUp,
    MessageSquare,
    Wallet,
    ShieldCheck,
    Star,
    Award,
    Building2,
    Zap,
    Check
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

import EditableBio from '@/components/landlord/EditableBio';

type LandlordProperty = {
    id: string;
    name: string;
    address: string;
    city: string;
    type: string;
    images: string[];
    is_featured: boolean;
};

type UnitSummary = {
    id: string;
    property_id: string;
    rent_amount: number;
    status: 'vacant' | 'occupied' | 'maintenance';
};

type TenantFeedbackItem = {
    id: string;
    tenant_id: string;
    rating: number;
    comment: string;
    created_at: string;
    author_name: string;
};

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0,
    }).format(amount);
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

export default async function LandlordProfilePage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const [profileRes, propertiesRes, activeLeasesRes, paymentsRes, feedbackRes] =
        await Promise.all([
            supabase
                .from('profiles')
                .select('id, full_name, email, role, avatar_url, phone, created_at')
                .eq('id', user.id)
                .maybeSingle(),
            supabase
                .from('properties')
                .select('id, name, address, city, type, images, is_featured')
                .eq('landlord_id', user.id)
                .order('created_at', { ascending: false }),
            supabase
                .from('leases')
                .select('id', { count: 'exact', head: true })
                .eq('landlord_id', user.id)
                .eq('status', 'active'),
            supabase
                .from('payments')
                .select('amount, status, paid_at, due_date')
                .eq('landlord_id', user.id),
            supabase
                .from('landlord_reviews')
                .select('id, tenant_id, rating, comment, created_at')
                .eq('landlord_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5),
        ]);

    const profile = profileRes.data;
    const properties = (propertiesRes.data ?? []) as LandlordProperty[];

    if (!profile) {
        redirect('/login');
    }

    const googleAvatarUrl = resolveGoogleAvatarUrl(user);
    const profileAvatarUrl = profile.avatar_url ?? googleAvatarUrl;

    const propertyIds = properties.map((property) => property.id);
    const units: UnitSummary[] =
        propertyIds.length > 0
            ? (
                  (
                      await supabase
                          .from('units')
                          .select('id, property_id, rent_amount, status')
                          .in('property_id', propertyIds)
                  ).data ?? []
              )
            : [];

    const occupiedUnits = units.filter((unit) => unit.status === 'occupied').length;
    const totalUnits = units.length;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    const payments = paymentsRes.data ?? [];
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);

    const paymentStats = payments.reduce(
        (acc, payment) => {
            const amount = Number(payment.amount ?? 0);

            if (payment.status === 'completed') {
                acc.totalCollected += amount;
                if (payment.paid_at?.startsWith(currentMonth)) {
                    acc.thisMonthCollected += amount;
                }
            }

            if (payment.status === 'pending') {
                acc.totalPending += amount;
                if (new Date(payment.due_date) < now) {
                    acc.overdueCount += 1;
                }
            }

            return acc;
        },
        { totalCollected: 0, thisMonthCollected: 0, totalPending: 0, overdueCount: 0 }
    );

    const activeLeases = activeLeasesRes.count ?? 0;

    const feedbackRows = (feedbackRes.data ?? []).filter(
        (item): item is { id: string; tenant_id: string; rating: number; comment: string | null; created_at: string } =>
            typeof item.rating === 'number' && item.rating >= 1 && item.rating <= 5
    );

    const tenantIds = [...new Set(feedbackRows.map((item) => item.tenant_id))];

    const tenantNameMap =
        tenantIds.length > 0
            ? new Map(
                  ((
                      await supabase
                          .from('profiles')
                          .select('id, full_name')
                          .in('id', tenantIds)
                  ).data ?? []).map((profileItem) => [profileItem.id, profileItem.full_name])
              )
            : new Map<string, string>();

    const tenantFeedback: TenantFeedbackItem[] = feedbackRows.map((item) => ({
        id: item.id,
        tenant_id: item.tenant_id,
        rating: item.rating,
        comment: item.comment?.trim() || 'No written feedback provided.',
        created_at: item.created_at,
        author_name: tenantNameMap.get(item.tenant_id) ?? 'Unknown tenant',
    }));

    const averageRating =
        tenantFeedback.length > 0
            ? tenantFeedback.reduce((sum, feedback) => sum + feedback.rating, 0) / tenantFeedback.length
            : null;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 p-6 md:p-8">
            <div className="mx-auto max-w-6xl space-y-6">
                <section className="relative w-full min-h-[400px] rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl group">
                    {/* Background Image */}
                    <div className="absolute inset-0">
                        <Image
                            src="https://images.unsplash.com/photo-1512918580421-b2feee3b85a6?q=80&w=2000&auto=format&fit=crop"
                            alt="Penthouse"
                            fill
                            className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-[20s]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-black/30" />
                        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />
                    </div>
                    <div className="relative h-full flex flex-col justify-between p-8 md:p-12 z-10">

                        {/* User Profile - Repositioned to Top */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-center gap-6">
                                <div className="relative h-20 w-20 md:h-24 md:w-24 shrink-0 group/avatar cursor-pointer">
                                    <div className="absolute inset-0 rounded-full border border-white/20 animate-pulse-slow"></div>
                                    <div className="absolute inset-1 rounded-full overflow-hidden border-2 border-white/50 shadow-2xl group-hover/avatar:border-white transition-colors">
                                        {profileAvatarUrl ? (
                                            <Image
                                                src={profileAvatarUrl}
                                                alt={profile.full_name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                                                <User size={32} className="text-neutral-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center flex-wrap gap-3 mb-1">
                                        <h2 className="text-3xl md:text-4xl font-display text-white drop-shadow-lg">{profile.full_name}</h2>
                                        
                                        {/* Project Milestone Badges */}
                                        <div className="flex items-center gap-2.5 mt-1 relative z-50">
                                            {/* Fully Verified Badge */}
                                            {profile.phone && (
                                                <div className="relative group/badge cursor-help flex items-center justify-center w-8 h-8 rounded-full bg-[#6d9838]/10 border border-[#6d9838]/30 hover:bg-[#6d9838]/20 transition-colors">
                                                    <ShieldCheck size={16} className="text-[#6d9838]" />
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max max-w-[200px] p-2.5 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl opacity-0 scale-95 pointer-events-none group-hover/badge:opacity-100 group-hover/badge:scale-100 transition-all z-[100] text-center origin-top">
                                                        <p className="text-[11px] font-bold text-white mb-0.5">Fully Verified</p>
                                                        <p className="text-[9px] text-neutral-400 leading-relaxed whitespace-normal">Identity and contact details have been successfully verified.</p>
                                                    </div>
                                                </div>
                                            )}

                                            {occupancyRate === 100 && totalUnits > 0 && (
                                                <div className="relative group/badge cursor-help flex items-center justify-center w-8 h-8 rounded-full bg-[#6d9838]/10 border border-[#6d9838]/30 hover:bg-[#6d9838]/20 transition-colors">
                                                    <Award size={16} className="text-[#6d9838]" />
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max max-w-[200px] p-2.5 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl opacity-0 scale-95 pointer-events-none group-hover/badge:opacity-100 group-hover/badge:scale-100 transition-all z-[100] text-center origin-top">
                                                        <p className="text-[11px] font-bold text-white mb-0.5">Full House</p>
                                                        <p className="text-[9px] text-neutral-400 leading-relaxed whitespace-normal">Achieved 100% occupancy rate across all registered units.</p>
                                                    </div>
                                                </div>
                                            )}

                                            {properties.length >= 2 && (
                                                <div className="relative group/badge cursor-help flex items-center justify-center w-8 h-8 rounded-full bg-[#6d9838]/10 border border-[#6d9838]/30 hover:bg-[#6d9838]/20 transition-colors">
                                                    <Building2 size={16} className="text-[#6d9838]" />
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max max-w-[200px] p-2.5 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl opacity-0 scale-95 pointer-events-none group-hover/badge:opacity-100 group-hover/badge:scale-100 transition-all z-[100] text-center origin-top">
                                                        <p className="text-[11px] font-bold text-white mb-0.5">Mogul</p>
                                                        <p className="text-[9px] text-neutral-400 leading-relaxed whitespace-normal">Successfully managing multiple properties on the platform.</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="relative group/badge cursor-help flex items-center justify-center w-8 h-8 rounded-full bg-[#6d9838]/10 border border-[#6d9838]/30 hover:bg-[#6d9838]/20 transition-colors">
                                                <Zap size={16} className="text-[#6d9838]" />
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max max-w-[200px] p-2.5 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl opacity-0 scale-95 pointer-events-none group-hover/badge:opacity-100 group-hover/badge:scale-100 transition-all z-[100] text-center origin-top">
                                                    <p className="text-[11px] font-bold text-white mb-0.5">Lightning Responder</p>
                                                    <p className="text-[9px] text-neutral-400 leading-relaxed whitespace-normal">Maintains an average response time of under 1 hour.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/80">
                                        <span className="text-[10px] font-bold tracking-widest uppercase bg-white/10 px-2 py-1 rounded backdrop-blur-sm border border-white/10">ID : {profile.id.substring(0,8).toUpperCase()}</span>
                                        <div className="flex items-center gap-1.5 opacity-90">
                                            <div className="h-1.5 w-1.5 rounded-full bg-[#6d9838]"></div>
                                            <span className="text-[10px] font-bold tracking-widest uppercase">Verified Landlord</span>
                                        </div>
                                    </div>
                                    <EditableBio initialBio={(profile as { bio?: string })?.bio || user.user_metadata?.bio || ''} />
                                </div>
                            </div>

                            <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto mt-4 md:mt-0">
                                <div className="flex flex-col md:items-end gap-1 text-sm text-white/90 font-medium">
                                    <span className="flex items-center justify-end gap-2 mb-1 opacity-80"><MapPin size={14} /> {properties[0]?.city ?? 'No city yet'}</span>
                                    <a href={`mailto:${profile.email}`} className="hover:text-[#6d9838] transition-colors hover:underline decoration-[#6d9838]/50 underline-offset-4">{profile.email}</a>
                                    {profile.phone && <a href={`tel:${profile.phone}`} className="hover:text-[#6d9838] transition-colors">{profile.phone}</a>}
                                </div>
                                <div className="flex gap-3 mt-2">
                                    <Link
                                        href="/landlord/messages"
                                        className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-full bg-[#6d9838] hover:bg-[#5a7d2e] text-white border border-[#6d9838] backdrop-blur-md text-[10px] font-bold tracking-widest uppercase transition-all duration-300 shadow-lg"
                                    >
                                        <MessageSquare size={14} />
                                        Messages
                                    </Link>
                                    <Link
                                        href="/landlord/settings"
                                        className="inline-flex items-center justify-center px-6 py-2 rounded-full bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 backdrop-blur-md text-[10px] font-bold tracking-widest uppercase transition-all duration-300"
                                    >
                                        Edit Profile
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Stats Info (Bottom) */}
                        <div className="mt-auto pt-16">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 border-t border-white/10 pt-6 backdrop-blur-[2px] bg-black/5 rounded-xl p-4 -mx-4 md:mx-0">
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest text-white/60 uppercase mb-2 flex items-center gap-1.5"><Home size={14} className="text-[#6d9838]"/> Properties</p>
                                    <p className="text-white font-medium text-2xl md:text-3xl">{properties.length}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest text-white/60 uppercase mb-2 flex items-center gap-1.5"><TrendingUp size={14} className="text-[#6d9838]"/> Unit Occupancy</p>
                                    <p className="text-white font-medium text-2xl md:text-3xl">{occupancyRate}%</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest text-white/60 uppercase mb-2 flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#6d9838]"/> Active Leases</p>
                                    <p className="text-white font-medium text-2xl md:text-3xl">{activeLeases}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest text-white/60 uppercase mb-2 flex items-center gap-1.5"><Wallet size={14} className="text-[#6d9838]"/> Collected This Month</p>
                                    <p className="text-white font-medium text-2xl md:text-3xl">{formatCurrency(paymentStats.thisMonthCollected)}</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

                <div className="space-y-6">

                    {/* Trust Center - Full Width */}
                    <div className="bg-[#171717]/80 border border-neutral-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
                        <div className="flex items-center gap-3 mb-6 md:mb-8">
                            <div className="w-12 h-12 bg-[#6d9838]/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-[#6d9838]/20">
                                <ShieldCheck size={24} className="text-[#6d9838]" />
                            </div>
                            <div>
                                <h3 className="text-xl font-display text-white">Trust Center</h3>
                                <p className="text-sm text-neutral-400">Platform safety & verification</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1 p-5 bg-black/40 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-bold text-white uppercase tracking-wider">Identity</span>
                                    <Check size={18} className="text-[#6d9838]" />
                                </div>
                                <p className="text-sm text-neutral-400">Government ID verified</p>
                            </div>

                            <div className="flex flex-col gap-1 p-5 bg-black/40 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-bold text-white uppercase tracking-wider">Email Address</span>
                                    <Check size={18} className="text-[#6d9838]" />
                                </div>
                                <p className="text-sm text-neutral-400">Confirmed contact linked</p>
                            </div>

                            <div className="flex flex-col gap-1 p-5 bg-black/40 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-bold text-white uppercase tracking-wider">Phone Number</span>
                                    {profile.phone ? (
                                        <Check size={18} className="text-[#6d9838]" />
                                    ) : (
                                        <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest bg-orange-400/10 px-2.5 py-1 rounded border border-orange-400/20">Action Required</span>
                                    )}
                                </div>
                                <p className="text-sm text-neutral-400">{profile.phone ? "SMS capable" : "Needs setup in settings"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area: Reviews & Milestones */}
                    <div className="space-y-6">

                        {/* Tenant feedback from landlord reviews */}
                        <div className="bg-[#171717]/80 border border-neutral-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h3 className="text-xl font-display text-white mb-1">Tenant Feedback</h3>
                                    <p className="text-sm text-neutral-400">Recent ratings and reviews from tenants</p>
                                </div>
                                <div className="flex items-center w-fit gap-2 bg-[#6d9838]/10 text-[#6d9838] px-4 py-2 rounded-full border border-[#6d9838]/20 shadow-[0_0_15px_rgba(109,152,56,0.1)]">
                                    <Star className="fill-current text-[#6d9838]" size={16} />
                                    <span className="font-bold text-sm">
                                        {averageRating ? `${averageRating.toFixed(1)} / 5.0` : 'No ratings yet'}
                                    </span>
                                </div>
                            </div>

                            {tenantFeedback.length > 0 ? (
                                <div className="grid gap-4">
                                    {tenantFeedback.map((feedback) => (
                                        <div key={feedback.id} className="bg-black/40 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-white font-medium text-sm">{feedback.author_name}</span>
                                                        <span className="text-[10px] font-bold tracking-widest text-[#6d9838] uppercase bg-[#6d9838]/10 px-2 py-0.5 rounded">{feedback.rating.toFixed(1)} stars</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-1.5">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                                key={star}
                                                                size={12}
                                                                className={star <= Math.round(feedback.rating) ? 'fill-[#6d9838] text-[#6d9838]' : 'text-neutral-600'}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <span className="text-xs text-neutral-500 whitespace-nowrap">{formatRelativeDate(feedback.created_at)}</span>
                                            </div>
                                            <p className="text-sm text-neutral-300 leading-relaxed italic">&quot;{feedback.comment}&quot;</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-6">
                                    <p className="text-sm text-neutral-300">No tenant reviews yet.</p>
                                    <p className="text-xs text-neutral-500 mt-1">
                                        Reviews will appear here once tenants submit landlord ratings.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}