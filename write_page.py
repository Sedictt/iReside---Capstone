import sys

content = '''"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ShieldCheck, Wallet, Lock } from "lucide-react";

const FEATURES = [
    {
        id: 1,
        title: "Private & Secure",
        desc: "No public listings. Your properties are hidden from the general public. We only invite verified, background-checked tenants.",
        icon: Lock,
    },
    {
        id: 2,
        title: "Automated Rent",
        desc: "Stop chasing payments. Rent is collected automatically on the 1st of every month and deposited directly to you.",
        icon: Wallet,
    },
    {
        id: 3,
        title: "Zero Headaches",
        desc: "Designed for property owners, not tech experts. Manage simple leases, maintenance requests, and communication from one shockingly easy dashboard.",
        icon: ShieldCheck,
    }
];

export default function ScrollyTellingLandingPage() {
    const { scrollYProgress } = useScroll();
    const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

    return (
        <div className="min-h-screen bg-[#020202] text-white selection:bg-emerald-500/30 font-sans overflow-x-hidden">
            {/* Background Noise */}
            <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.02] mix-blend-overlay" style={{ backgroundImage: 'url("/assets/noise.png")' }} />

            {/* Clean, Simple Navbar */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020202]/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-white flex items-center justify-center rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            <div className="h-3 w-3 bg-black rounded-sm" />
                        </div>
                        <span className="text-2xl font-extrabold tracking-tight">iReside</span>
                    </div>
                    <Link href="/login" className="text-sm font-bold text-white/50 hover:text-white hover:bg-white/5 px-4 py-2 rounded-full transition-all">
                        Sign In
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-[100vh] flex flex-col items-center justify-center px-6 overflow-hidden">
                <motion.div style={{ y }} className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/15 via-black to-black -z-10" />
                
                <div className="max-w-5xl mx-auto text-center pt-20">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 mb-8 md:mb-12 shadow-inner">
                            <ShieldCheck className="h-4 w-4" />
                            Exclusive Network for Landlords
                        </span>
                        <h1 className="text-6xl md:text-8xl lg:text-[8rem] font-extrabold tracking-tighter leading-[0.9] mb-8">
                            <span className="text-white/30 block mb-2 text-4xl md:text-6xl lg:text-[6rem]">Property Management,</span>
                            Perfected.
                        </h1>
                        <p className="text-xl md:text-3xl text-white/50 max-w-3xl mx-auto font-medium leading-relaxed mb-12 tracking-tight">
                            iReside is a highly secure, invite-only platform. We bring you verified tenants, automate your rent, and remove the stress of being a landlord.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Link href="/apply-landlord" className="group relative flex items-center justify-center h-16 md:h-20 px-8 md:px-12 rounded-full bg-emerald-500 text-black font-extrabold text-lg md:text-xl hover:bg-emerald-400 transition-all hover:scale-105 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                                Apply for Platform Access
                                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1.5 transition-transform" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Scrollytelling Features */}
            <section className="py-20 md:py-40 px-6 bg-[#020202] relative">
                <div className="max-w-6xl mx-auto">
                    {FEATURES.map((feature, index) => (
                        <motion.div 
                            key={feature.id}
                            initial={{ opacity: 0, y: 120 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-25%" }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24 py-20 md:py-32 border-t border-white/5 first:border-0"
                        >
                            <div className={lex-1 \}>
                                <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                                    <feature.icon className="h-10 w-10 text-emerald-400" />
                                </div>
                                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">{feature.title}</h2>
                                <p className="text-xl md:text-2xl text-white/40 leading-relaxed font-medium">
                                    {feature.desc}
                                </p>
                            </div>
                            <div className={lex-1 w-full aspect-square md:aspect-video lg:aspect-square rounded-[3rem] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 \ flex items-center justify-center p-8 md:p-16 relative overflow-hidden group}>
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                <div className="w-full h-full rounded-[2rem] border border-white/5 bg-black/60 backdrop-blur-md shadow-2xl flex items-center justify-center relative transform group-hover:scale-[1.02] transition-transform duration-700">
                                     <feature.icon className="h-32 w-32 md:h-40 md:w-40 text-white/[0.03] group-hover:text-emerald-500/10 transition-colors duration-700" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Massive CTA Footer */}
            <section className="relative py-32 md:py-52 px-6 border-t border-white/10 bg-[#050505] overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-900/10 via-[#050505] to-[#050505] pointer-events-none" />
                
                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <h2 className="text-5xl md:text-8xl font-extrabold tracking-tighter mb-8">
                            Join the Network.
                        </h2>
                        <p className="text-xl md:text-3xl text-white/40 font-medium mb-12 md:mb-16 tracking-tight">
                            We are currently accepting applications from property owners.
                        </p>
                        
                        <Link href="/apply-landlord" className="group inline-flex items-center justify-center h-16 md:h-24 px-8 md:px-14 rounded-full bg-emerald-500 text-black font-extrabold text-xl md:text-3xl hover:bg-emerald-400 transition-all hover:scale-105 shadow-[0_0_80px_rgba(16,185,129,0.25)]">
                            Start Verification
                            <ArrowRight className="ml-4 h-6 w-6 md:h-8 md:w-8 group-hover:translate-x-2 transition-transform" />
                        </Link>

                        <p className="mt-12 text-sm text-white/30 font-medium max-w-md mx-auto leading-relaxed">
                            Applications are reviewed manually by our administrators to maintain the quality and security of the iReside platform.
                        </p>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
'''

with open("src/app/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Page updated successfully!")
