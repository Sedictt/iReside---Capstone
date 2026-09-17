"use client";

import { useState } from "react";
import { 
    Facebook, 
    Instagram, 
    Twitter, 
    Linkedin, 
    Globe, 
    ExternalLink,
    X,
    Plus,
    Share2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SocialLinksEditor } from "./SocialLinksEditor";

type Socials = {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    website?: string;
};

type SocialsHeaderProps = {
    userId: string;
    initialSocials: Socials;
};

export function SocialsHeader({ userId, initialSocials }: SocialsHeaderProps) {
    const [socials, setSocials] = useState<Socials>(initialSocials);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const supabase = createClient();

    const handleSave = async (newSocials: Socials) => {
        const { error } = await supabase
            .from("profiles")
            .update({ socials: newSocials })
            .eq("id", userId);

        if (error) throw error;
        setSocials(newSocials);
        setIsModalOpen(false);
    };

    const socialIcons = [
        { key: 'facebook' as keyof Socials, icon: Facebook, label: 'Facebook' },
        { key: 'instagram' as keyof Socials, icon: Instagram, label: 'Instagram' },
        { key: 'twitter' as keyof Socials, icon: Twitter, label: 'Twitter' },
        { key: 'linkedin' as keyof Socials, icon: Linkedin, label: 'LinkedIn' },
        { key: 'website' as keyof Socials, icon: Globe, label: 'Website' }
    ];

    const hasAnySocial = Object.values(socials).some(val => !!val);

    return (
        <>
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 pt-8 border-t border-black/10 dark:border-white/5 w-full max-w-2xl">
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
                
                {/* Manage Socials Trigger */}
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-3 px-6 h-12 rounded-2xl neumorphic-extruded border border-dashed border-border text-muted-foreground hover:text-foreground transition-all duration-300 group cursor-pointer"
                    title="Manage Social Links"
                >
                    {hasAnySocial ? (
                        <>
                            <ExternalLink size={16} className="group-hover:rotate-12 transition-transform" />
                            <span className="text-[10px] font-black tracking-widest uppercase">Manage Socials</span>
                        </>
                    ) : (
                        <>
                            <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                            <span className="text-[10px] font-black tracking-widest uppercase">Add Connectivity</span>
                        </>
                    )}
                </button>
            </div>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setIsModalOpen(false)}
                    />
                    <div className="relative w-full max-w-md animate-in zoom-in fade-in duration-300">
                        <div className="neumorphic-panel bg-card text-card-foreground border border-border rounded-[2.5rem] p-8 shadow-2xl">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-xl neumorphic-inset-card flex items-center justify-center text-primary">
                                        <Share2 size={20} className="text-primary" />
                                    </div>
                                    <h3 className="text-xl font-display font-black tracking-tight text-foreground">Social Connectivity</h3>
                                </div>
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="size-10 rounded-full neumorphic-extruded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                                Connect your professional social channels to build trust and allow tenants to verify your business presence.
                            </p>

                            <SocialLinksEditor 
                                initialSocials={socials} 
                                onSave={handleSave} 
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

