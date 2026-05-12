"use client";

import { createClient } from "@/lib/supabase/client";
import { SocialLinksEditor } from "./SocialLinksEditor";

type Socials = {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    website?: string;
};

type SocialConnectivityProps = {
    userId: string;
    initialSocials: Socials;
};

export function SocialConnectivity({ userId, initialSocials }: SocialConnectivityProps) {
    const supabase = createClient();

    const handleSave = async (newSocials: Socials) => {
        const { error } = await supabase
            .from("profiles")
            .update({ socials: newSocials })
            .eq("id", userId);

        if (error) throw error;
    };

    return (
        <div className="mt-10 pt-10 border-t border-white/10">
            <p className="text-[9px] font-black tracking-widest text-neutral-500 uppercase mb-4 text-center">Social Connectivity</p>
            <SocialLinksEditor initialSocials={initialSocials} onSave={handleSave} />
        </div>
    );
}
