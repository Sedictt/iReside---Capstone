'use client'

import {
    Facebook,
    Instagram,
    Twitter,
    Linkedin,
    Globe,
    ExternalLink
} from "lucide-react";

type Socials = {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    website?: string;
};

type ReadOnlySocialsProps = {
    socials: Socials
    className?: string
}

export function ReadOnlySocials({ socials, className = "" }: ReadOnlySocialsProps) {
    const socialIcons = [
        { key: 'facebook' as keyof Socials, icon: Facebook, label: 'Facebook' },
        { key: 'instagram' as keyof Socials, icon: Instagram, label: 'Instagram' },
        { key: 'twitter' as keyof Socials, icon: Twitter, label: 'Twitter' },
        { key: 'linkedin' as keyof Socials, icon: Linkedin, label: 'LinkedIn' },
        { key: 'website' as keyof Socials, icon: Globe, label: 'Website' }
    ];

    const hasAnySocial = Object.values(socials).some(val => !!val);
    if (!hasAnySocial) return null;

    return (
        <div className={`flex flex-wrap items-center justify-center gap-6 pt-8 border-t border-white/5 w-full max-w-2xl ${className}`}>
            {socialIcons.map((social) => {
                const url = socials[social.key];
                if (!url) return null;

                return (
                    <a
                        key={social.key}
                        href={url.startsWith('http') ? url : `https://${url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="size-12 rounded-2xl bg-white/5 hover:bg-[#8B5CF6]/20 border border-white/10 hover:border-[#8B5CF6]/40 flex items-center justify-center text-neutral-400 hover:text-[#8B5CF6] transition-all duration-300 group/social shadow-lg hover:shadow-[#8B5CF6]/10 hover:-translate-y-1"
                        title={social.label}
                    >
                        <social.icon size={20} className="group-hover/social:scale-110 transition-transform" />
                    </a>
                );
            })}
        </div>
    );
}