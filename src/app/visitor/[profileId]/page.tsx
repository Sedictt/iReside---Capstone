import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRound, ShieldCheck, Mail, CalendarClock, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function VisitorProfilePage({
    params,
}: {
    params: Promise<{ profileId: string }>;
}) {
    const { profileId } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, avatar_url, created_at")
        .eq("id", profileId)
        .maybeSingle();

    const { data: currentProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    const backHref = currentProfile?.role === "landlord" ? "/landlord/messages" : "/tenant/messages";

    if (!profile) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10">
                <Link href={backHref} className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-8">
                    <ArrowLeft className="w-4 h-4" /> Back to Messages
                </Link>
                <div className="max-w-xl rounded-2xl border border-white/10 bg-neutral-900/60 p-6">
                    <h1 className="text-xl font-bold">Profile not available</h1>
                    <p className="text-sm text-neutral-400 mt-2">This user profile could not be found or is no longer accessible.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10">
            <Link href={backHref} className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-8">
                <ArrowLeft className="w-4 h-4" /> Back to Messages
            </Link>

            <div className="max-w-2xl rounded-3xl border border-white/10 bg-neutral-900/60 p-6 md:p-8 shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center">
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
                        ) : (
                            <UserRound className="w-7 h-7 text-neutral-400" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">{profile.full_name}</h1>
                        <p className="text-xs uppercase tracking-widest text-neutral-400 mt-1">Visitor View</p>
                    </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold mb-2">Role</p>
                        <p className="text-sm font-semibold text-white flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" /> {profile.role}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold mb-2">Email</p>
                        <p className="text-sm font-semibold text-white flex items-center gap-2 break-all">
                            <Mail className="w-4 h-4 text-blue-400" /> {profile.email}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 md:col-span-2">
                        <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold mb-2">Member Since</p>
                        <p className="text-sm font-semibold text-white flex items-center gap-2">
                            <CalendarClock className="w-4 h-4 text-primary" />
                            {new Date(profile.created_at).toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                    </div>
                </div>

                <p className="mt-6 text-xs text-neutral-500 leading-relaxed">
                    This visitor profile intentionally shows limited identity details for safer messaging.
                </p>
            </div>
        </div>
    );
}
