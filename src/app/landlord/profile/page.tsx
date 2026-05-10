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
    Wallet,
    ShieldCheck,
    Star,
    Award,
    Building2,
    Zap,
    Check,
    Facebook,
    Twitter,
    Linkedin,
    Instagram,
    Globe,
    ExternalLink
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

import EditableBio from '@/components/landlord/EditableBio';
import { ProfileAvatarUploader } from '@/components/profile/ProfileAvatarUploader';
import { ProfileCoverUploader } from '@/components/profile/ProfileCoverUploader';
import { BusinessPermitCard } from '@/components/landlord/BusinessPermitCard';
import { RoleBadge } from '@/components/profile/RoleBadge';
import { SocialsHeader } from '@/components/profile/SocialsHeader';

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

    const [profileRes, propertiesRes, activeLeasesRes, paymentsRes, feedbackRes, applicationsRes] =
        await Promise.all([
            supabase
                .from('profiles')
                .select('id, full_name, email, role, avatar_url, avatar_bg_color, phone, bio, website, address, created_at, cover_url, socials, business_permit_url, business_permit_number, business_name')
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
            supabase
                .from('landlord_applications')
                .select('verification_status')
                .eq('profile_id', user.id)
                .maybeSingle(),
        ]);

    const profile = profileRes.data;
    const properties = (propertiesRes.data ?? []) as LandlordProperty[];
    const verificationStatus = applicationsRes.data?.verification_status === 'verified';

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

    // Type casting for socials
    const socials = (profile.socials as Record<string, string>) || {};

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 p-6 md:p-12">
            <div className="mx-auto max-w-5xl space-y-8">
                {/* Centered Profile Header Card */}
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
                                <h1 className="text-4xl md:text-5xl font-display font-semibold text-white tracking-tight">
                                    {profile.full_name}
                                </h1>
                                {verificationStatus && (
                                    <div className="bg-[#6d9838]/20 border border-[#6d9838]/30 p-1.5 rounded-full shadow-lg shadow-[#6d9838]/10">
                                        <CheckCircle2 size={20} className="text-[#6d9838]" />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-center gap-3">
                                <RoleBadge role={profile.role} className="scale-110" />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4 mb-12">
                            <Link
                                href="/landlord/settings"
                                className="px-10 py-3 rounded-2xl bg-white text-black font-bold text-[11px] tracking-widest uppercase transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-white/5"
                            >
                                Edit Profile
                            </Link>
                            <Link
                                href="/landlord/messages"
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
                                <p className="text-sm text-white/90 font-medium">{properties[0]?.city || 'Valenzuela, Metro Manila'}</p>
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
                        <h2 className="text-2xl font-display font-semibold text-white tracking-tight">Biography</h2>
                    </div>
                    <div className="max-w-4xl">
                        <EditableBio initialBio={profile.bio || ''} />
                    </div>
                </div>

                {/* Verified Business Permit Section */}
                <BusinessPermitCard 
                    businessName={profile.business_name || null}
                    permitUrl={profile.business_permit_url || null}
                    className="rounded-[3rem] shadow-xl"
                />

                {/* Stats & connectivity section */}
                <div className="bg-[#171717]/80 border border-neutral-800 rounded-[3rem] p-10 backdrop-blur-xl shadow-xl">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="size-12 rounded-2xl bg-[#6d9838]/10 flex items-center justify-center border border-[#6d9838]/20">
                            <TrendingUp size={20} className="text-[#6d9838]" />
                        </div>
                        <h2 className="text-2xl font-display font-semibold text-white tracking-tight">Portfolio Stats</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        <div className="bg-white/5 border border-white/5 p-6 rounded-[2rem]">
                            <p className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase mb-2">Total Units</p>
                            <p className="text-4xl font-display font-semibold text-white">{units.length}</p>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-6 rounded-[2rem]">
                            <p className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase mb-2">Occupancy</p>
                            <p className="text-4xl font-display font-semibold text-white">{occupancyRate}%</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

