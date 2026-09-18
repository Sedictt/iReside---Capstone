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
        <div className={`flex flex-wrap items-center justify-center gap-6 pt-8 border-t border-black/10 dark:border-white/5 w-full max-w-2xl ${className}`}>
            {socialIcons.map((social) => {
                const url = socials[social.key];
                if (!url) return null;

                return (
                    <a
                        key={social.key}
                        href={url.startsWith('http') ? url : `https://${url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="size-12 rounded-2xl neumorphic-inset-card hover:neumorphic-extruded flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300 group/social shadow-sm hover:-translate-y-1"
                        title={social.label}
                    >
                        <social.icon size={20} className="group-hover/social:scale-110 transition-transform" />
                    </a>
                );
            })}
        </div>
    );
}