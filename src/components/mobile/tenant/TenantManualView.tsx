'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
    ShieldAlert, 
    Phone, 
    BookOpen, 
    FileText, 
    AlertTriangle, 
    Flame, 
    Droplets, 
    Zap, 
    Key, 
    Clock, 
    Trash2, 
    CigaretteOff, 
    Dog, 
    Users, 
    Home, 
    HelpCircle, 
    Search, 
    ChevronRight, 
    ChevronDown, 
    ArrowRight,
    Wrench,
    CheckCircle2,
    Info,
    PhoneCall
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DOCS_ARTICLES, DocArticle } from '@/lib/docs/docsData';
import { DEFAULT_PROPERTY_RULES } from '@/lib/constants/rules';

interface QuickHotline {
    name: string;
    number: string;
    role: string;
    icon: typeof Phone;
    color: string;
    bg: string;
}

const EMERGENCY_HOTLINES: QuickHotline[] = [
    {
        name: 'National Emergency',
        number: '911',
        role: 'Police, Fire, Ambulance',
        icon: ShieldAlert,
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-500/10 border-red-500/20'
    },
    {
        name: 'PNP Police',
        number: '117',
        role: 'Law Enforcement',
        icon: PhoneCall,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-500/10 border-blue-500/20'
    },
    {
        name: 'Bureau of Fire Protection',
        number: '160',
        role: 'BFP Fire Dispatch',
        icon: Flame,
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-500/10 border-orange-500/20'
    },
    {
        name: 'Red Cross Philippines',
        number: '143',
        role: 'Disaster & Medical Aid',
        icon: AlertTriangle,
        color: 'text-rose-600 dark:text-rose-400',
        bg: 'bg-rose-500/10 border-rose-500/20'
    }
];

interface StandardRule {
    title: string;
    summary: string;
    details: string;
    icon: typeof Clock;
    category: 'curfew' | 'cleanliness' | 'safety' | 'conduct';
}

const STANDARD_RULES: StandardRule[] = [
    {
        title: 'Quiet Hours (10:00 PM – 8:00 AM)',
        summary: 'Noise curfew strictly observed across all corridors and common spaces.',
        details: 'Residents must keep audio equipment, musical instruments, and conversation at a respectful level during quiet hours. Loud social gatherings after 10 PM are prohibited.',
        icon: Clock,
        category: 'curfew'
    },
    {
        title: 'Proper Waste Disposal & Segregation',
        summary: 'Biodegradable, non-biodegradable, and recyclables must be bagged separately.',
        details: 'Deposit sealed trash bags into designated chute or ground bins between 6:00 PM and 8:00 PM. Do not leave waste bags in public hallways or outside unit doors.',
        icon: Trash2,
        category: 'cleanliness'
    },
    {
        title: 'Strict Smoke-Free Property',
        summary: 'Smoking and vaping are prohibited inside all units, balconies, and stairwells.',
        details: 'Violations trigger smoke alarm sensors and carry automatic maintenance penalties. Please use designated open-air street zones only.',
        icon: CigaretteOff,
        category: 'safety'
    },
    {
        title: 'Pet Policy & Hallway Leashing',
        summary: 'Registered pets only. All pets must be leashed in elevators and lobby.',
        details: 'Pet owners are responsible for immediate cleanup of accidental messes. Pets that generate excessive barking during quiet hours may be subject to review.',
        icon: Dog,
        category: 'conduct'
    },
    {
        title: 'Visitor Registration & Common Areas',
        summary: 'Guests must register with the lobby guardhouse after 10:00 PM.',
        details: 'Overnight visitors staying more than 3 consecutive nights must be declared to property management for security and fire safety records.',
        icon: Users,
        category: 'conduct'
    },
    {
        title: 'No Unauthorized Subleasing',
        summary: 'Short-term rentals (e.g., Airbnb) or unauthorized sublets are strictly forbidden.',
        details: 'Only tenants named on the verified lease contract are authorized primary residents. Lease termination penalties apply for unapproved third-party occupancy.',
        icon: Home,
        category: 'safety'
    }
];

interface EmergencyProtocol {
    title: string;
    icon: typeof Flame;
    color: string;
    steps: string[];
    criticalTip: string;
}

const EMERGENCY_PROTOCOLS: EmergencyProtocol[] = [
    {
        title: 'Fire Alarm & Smoke Evacuation',
        icon: Flame,
        color: 'text-red-500 bg-red-500/10 border-red-500/20',
        steps: [
            'Alert all occupants inside your unit immediately.',
            'Touch unit doors before opening; if hot, do not open and seek secondary egress.',
            'Use the nearest designated fire emergency stairs. NEVER use elevators.',
            'Proceed directly to the ground assembly area and check in with building marshals.',
            'Call 911 / BFP 160 immediately once safely outside.'
        ],
        criticalTip: 'Stay low to the floor if smoke is present; breathe through a damp cloth if available.'
    },
    {
        title: 'Major Water Leak / Pipe Burst',
        icon: Droplets,
        color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
        steps: [
            'Locate your unit main water shutoff valve (usually beside the water meter or under kitchen sink).',
            'Turn the valve clockwise to stop pressurized water flow.',
            'Keep appliances and electronics elevated from standing water.',
            'File an urgent emergency maintenance ticket on iReside with photo evidence.',
            'Notify your building maintenance hotline immediately.'
        ],
        criticalTip: 'Do not touch submerged electrical plugs or sockets. Turn off corresponding breakers first.'
    },
    {
        title: 'Power Outage & Tripped Breaker',
        icon: Zap,
        color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        steps: [
            'Check if hallway lighting and neighboring units still have electricity.',
            'If isolated to your unit, locate your main circuit breaker panel (typically near entrance door).',
            'Look for any switch in the middle / tripped position. Push firmly OFF, then ON.',
            'Unplug heavy appliances (air conditioner, microwave) before resetting breakers.',
            'If breaker trips immediately again, report a short circuit repair request.'
        ],
        criticalTip: 'Keep refrigerator closed to preserve perishables during extended municipal blackouts.'
    },
    {
        title: 'Key Card Misplacement & Lockout',
        icon: Key,
        color: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
        steps: [
            'Head down to the main security guardhouse or management office.',
            'Present your government-issued ID or iReside verified mobile profile.',
            'Building security will accompany you to verify identity and unlock your unit.',
            'Request a replacement key card via Property Manager messaging.'
        ],
        criticalTip: 'Lockout assistance between 11 PM and 6 AM may incur standard building lockout service charges.'
    }
];

export function TenantManualView() {
    const [selectedTab, setSelectedTab] = useState<'hotlines' | 'rules' | 'protocols' | 'handbook'>('rules');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedRule, setExpandedRule] = useState<string | null>(null);
    const [expandedProtocol, setExpandedProtocol] = useState<string | null>('Fire Alarm & Smoke Evacuation');
    const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

    // Filter tenant articles
    const tenantArticles = useMemo(() => {
        return DOCS_ARTICLES.filter((a: DocArticle) => a.audience === 'tenant');
    }, []);

    const filteredArticles = useMemo(() => {
        if (!searchQuery.trim()) return tenantArticles;
        const q = searchQuery.toLowerCase();
        return tenantArticles.filter((a: DocArticle) => 
            a.title.toLowerCase().includes(q) ||
            a.summary.toLowerCase().includes(q) ||
            a.categoryLabel.toLowerCase().includes(q) ||
            a.keywords.some((k: string) => k.toLowerCase().includes(q))
        );
    }, [tenantArticles, searchQuery]);

    const toggleRule = (title: string) => {
        setExpandedRule(prev => prev === title ? null : title);
    };

    const toggleProtocol = (title: string) => {
        setExpandedProtocol(prev => prev === title ? null : title);
    };

    const toggleArticle = (id: string) => {
        setExpandedArticle(prev => prev === id ? null : id);
    };

    return (
        <div className="flex flex-col gap-3 pb-8">
            {/* Top Critical Hotline Strip */}
            <div className="px-4 pt-2.5">
                <div className="rounded-2xl p-3.5 bg-gradient-to-br from-red-500/15 via-red-500/5 to-transparent border border-red-500/30 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-black uppercase tracking-wider">
                            <ShieldAlert className="size-3.5 animate-pulse" />
                            <span>Emergency Hotlines</span>
                        </div>
                        <span className="text-[10px] font-semibold text-red-500/80">Tap to call</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {EMERGENCY_HOTLINES.slice(0, 2).map((item) => (
                            <a
                                key={item.number}
                                href={'tel:' + item.number}
                                className={cn(
                                    "p-2.5 rounded-xl border flex items-center justify-between transition-all active:scale-95 shadow-2xs",
                                    item.bg
                                )}
                            >
                                <div className="min-w-0 pr-1">
                                    <span className="text-[10px] font-bold text-muted-foreground block truncate">
                                        {item.name}
                                    </span>
                                    <span className={cn("text-xs font-black block mt-0.5", item.color)}>
                                        Dial {item.number}
                                    </span>
                                </div>
                                <item.icon className={cn("size-4 shrink-0", item.color)} />
                            </a>
                        ))}
                    </div>

                    <div className="mt-2 pt-2 border-t border-red-500/20 flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Building Admin / Security Desk</span>
                        <Link 
                            href="/mobile/tenant/messages" 
                            className="font-bold text-primary hover:underline flex items-center gap-1"
                        >
                            <span>Chat Manager</span>
                            <ArrowRight className="size-3" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-4">
                <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold">
                    <button
                        type="button"
                        onClick={() => setSelectedTab('rules')}
                        className={cn(
                            "py-2 rounded-xl text-center transition-all cursor-pointer",
                            selectedTab === 'rules'
                                ? "bg-white dark:bg-card text-foreground shadow-xs font-black"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Rules
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedTab('protocols')}
                        className={cn(
                            "py-2 rounded-xl text-center transition-all cursor-pointer",
                            selectedTab === 'protocols'
                                ? "bg-white dark:bg-card text-foreground shadow-xs font-black"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Safety
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedTab('handbook')}
                        className={cn(
                            "py-2 rounded-xl text-center transition-all cursor-pointer",
                            selectedTab === 'handbook'
                                ? "bg-white dark:bg-card text-foreground shadow-xs font-black"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Guide
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedTab('hotlines')}
                        className={cn(
                            "py-2 rounded-xl text-center transition-all cursor-pointer",
                            selectedTab === 'hotlines'
                                ? "bg-white dark:bg-card text-foreground shadow-xs font-black"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Contacts
                    </button>
                </div>
            </div>

            {/* TAB: HOUSE RULES */}
            {selectedTab === 'rules' && (
                <div className="px-4 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                                Community House Rules
                            </h3>
                            <p className="text-[11px] text-muted-foreground">Standard residential conduct & building policies</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            6 Policies
                        </span>
                    </div>

                    <div className="flex flex-col gap-2">
                        {STANDARD_RULES.map((rule) => {
                            const isExpanded = expandedRule === rule.title;
                            return (
                                <div
                                    key={rule.title}
                                    className="rounded-2xl bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs overflow-hidden transition-all"
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleRule(rule.title)}
                                        className="w-full p-3.5 flex items-start justify-between text-left gap-3 cursor-pointer"
                                    >
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                                                <rule.icon className="size-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-xs font-bold text-foreground">
                                                    {rule.title}
                                                </h4>
                                                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                                                    {rule.summary}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-muted-foreground mt-1">
                                            {isExpanded ? (
                                                <ChevronDown className="size-4 text-primary" />
                                            ) : (
                                                <ChevronRight className="size-4" />
                                            )}
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="px-3.5 pb-3.5 pt-0 border-t border-slate-100 dark:border-white/5 mt-1">
                                            <p className="text-xs text-foreground/90 leading-relaxed mt-2.5 bg-slate-50 dark:bg-white/5 p-3 rounded-xl">
                                                {rule.details}
                                            </p>
                                            <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                <Info className="size-3 text-primary" />
                                                <span>Refer to your signed lease agreement for specific violation terms.</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Quick Link to Lease Terms */}
                    <div className="mt-1 p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                        <div>
                            <h4 className="text-xs font-bold text-foreground">Need Full Lease Contract?</h4>
                            <p className="text-[11px] text-muted-foreground">View signed clauses, deposit terms & addenda</p>
                        </div>
                        <Link
                            href="/mobile/tenant/lease"
                            className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition-all"
                        >
                            <span>Open Lease</span>
                            <ArrowRight className="size-3" />
                        </Link>
                    </div>
                </div>
            )}

            {/* TAB: EMERGENCY & SAFETY PROTOCOLS */}
            {selectedTab === 'protocols' && (
                <div className="px-4 flex flex-col gap-2.5">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                            Incident Safety Protocols
                        </h3>
                        <p className="text-[11px] text-muted-foreground">Step-by-step actions for building emergencies</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        {EMERGENCY_PROTOCOLS.map((protocol) => {
                            const isExpanded = expandedProtocol === protocol.title;
                            return (
                                <div
                                    key={protocol.title}
                                    className="rounded-2xl bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs overflow-hidden transition-all"
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleProtocol(protocol.title)}
                                        className="w-full p-3.5 flex items-center justify-between text-left gap-3 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={cn("size-8 rounded-xl border flex items-center justify-center shrink-0", protocol.color)}>
                                                <protocol.icon className="size-4" />
                                            </div>
                                            <h4 className="text-xs font-bold text-foreground truncate">
                                                {protocol.title}
                                            </h4>
                                        </div>
                                        <div className="shrink-0 text-muted-foreground">
                                            {isExpanded ? (
                                                <ChevronDown className="size-4 text-primary" />
                                            ) : (
                                                <ChevronRight className="size-4" />
                                            )}
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="px-3.5 pb-3.5 border-t border-slate-100 dark:border-white/5 pt-3">
                                            <ol className="flex flex-col gap-2">
                                                {protocol.steps.map((step, idx) => (
                                                    <li key={idx} className="flex items-start gap-2.5 text-xs text-foreground/90">
                                                        <span className="size-4 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                                                            {idx + 1}
                                                        </span>
                                                        <span className="leading-snug">{step}</span>
                                                    </li>
                                                ))}
                                            </ol>

                                            <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] flex items-start gap-2">
                                                <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                                                <span className="font-semibold">{protocol.criticalTip}</span>
                                            </div>

                                            {protocol.title.includes('Water') && (
                                                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 flex justify-end">
                                                    <Link
                                                        href="/mobile/tenant/maintenance"
                                                        className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                                                    >
                                                        <span>Report Urgent Water Leak</span>
                                                        <ArrowRight className="size-3" />
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB: RESIDENT GUIDE & HANDBOOK */}
            {selectedTab === 'handbook' && (
                <div className="px-4 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                                Resident Handbook & FAQs
                            </h3>
                            <p className="text-[11px] text-muted-foreground">Quick answers for payments, repairs & living</p>
                        </div>
                    </div>

                    {/* Search Field */}
                    <div className="relative">
                        <Search className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search guide (e.g. WiFi, garbage, submeters)..."
                            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-card border border-slate-300 dark:border-white/15 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs"
                        />
                    </div>

                    {/* Articles List */}
                    <div className="flex flex-col gap-2">
                        {filteredArticles.length === 0 ? (
                            <div className="p-8 rounded-2xl bg-white dark:bg-card/60 border border-slate-300 dark:border-white/15 text-center">
                                <BookOpen className="size-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                                <p className="text-xs font-bold text-foreground">No articles found</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Try searching for another keyword</p>
                            </div>
                        ) : (
                            filteredArticles.map((article: DocArticle) => {
                                const isExpanded = expandedArticle === article.id;
                                return (
                                    <div
                                        key={article.id}
                                        className="rounded-2xl bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs overflow-hidden transition-all"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => toggleArticle(article.id)}
                                            className="w-full p-3.5 flex items-start justify-between text-left gap-3 cursor-pointer"
                                        >
                                            <div className="min-w-0">
                                                <span className="text-[9px] font-black uppercase tracking-wider text-primary block">
                                                    {article.categoryLabel}
                                                </span>
                                                <h4 className="text-xs font-bold text-foreground mt-0.5">
                                                    {article.title}
                                                </h4>
                                                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                                                    {article.summary}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-muted-foreground mt-1">
                                                {isExpanded ? (
                                                    <ChevronDown className="size-4 text-primary" />
                                                ) : (
                                                    <ChevronRight className="size-4" />
                                                )}
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-100 dark:border-white/5">
                                                <p className="text-xs text-foreground/90 leading-relaxed mt-2 bg-slate-50 dark:bg-white/5 p-3 rounded-xl">
                                                    {article.summary}
                                                </p>

                                                {article.steps && article.steps.length > 0 && (
                                                    <div className="mt-3 flex flex-col gap-2">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                            Step-by-Step Instructions
                                                        </span>
                                                        {article.steps.map((step: any, idx: number) => (
                                                            <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex flex-col gap-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="size-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                                                                        {idx + 1}
                                                                    </span>
                                                                    <span className="text-xs font-bold text-foreground">{step.title}</span>
                                                                </div>
                                                                <p className="text-[11px] text-muted-foreground pl-6 leading-relaxed">
                                                                    {step.description}
                                                                </p>
                                                                {step.tip && (
                                                                    <div className="ml-6 mt-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                                        Tip: {step.tip}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {article.actionShortcut && article.actionShortcut.href && (
                                                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 flex justify-end">
                                                        <Link
                                                            href={article.actionShortcut.href.startsWith('/mobile') ? article.actionShortcut.href : ('/mobile' + article.actionShortcut.href.replace(/^\/tenant/, '/tenant'))}
                                                            className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition-all"
                                                        >
                                                            <span>{article.actionShortcut.label}</span>
                                                            <ArrowRight className="size-3" />
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* TAB: CONTACTS & HOTLINES DIRECTORY */}
            {selectedTab === 'hotlines' && (
                <div className="px-4 flex flex-col gap-2.5">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                            Emergency & Service Directory
                        </h3>
                        <p className="text-[11px] text-muted-foreground">Immediate contacts for security, police, fire & hospital</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        {EMERGENCY_HOTLINES.map((hotline) => (
                            <div
                                key={hotline.number}
                                className="p-3.5 rounded-2xl bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn("size-9 rounded-xl border flex items-center justify-center shrink-0", hotline.bg)}>
                                        <hotline.icon className={cn("size-4", hotline.color)} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-foreground">{hotline.name}</h4>
                                        <p className="text-[11px] text-muted-foreground">{hotline.role}</p>
                                    </div>
                                </div>
                                <a
                                    href={'tel:' + hotline.number}
                                    className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition-all"
                                >
                                    <Phone className="size-3" />
                                    <span>Call {hotline.number}</span>
                                </a>
                            </div>
                        ))}
                    </div>

                    {/* Support Card */}
                    <div className="mt-1 p-4 rounded-2xl bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-primary text-xs font-bold">
                            <BookOpen className="size-4" />
                            <span>Building Administration Desk</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            For non-emergency inquiries such as elevator booking, package delivery notices, or gate passes, please chat directly with property management.
                        </p>
                        <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex gap-2">
                            <Link
                                href="/mobile/tenant/messages"
                                className="flex-1 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold text-center flex items-center justify-center gap-1 hover:bg-primary/20 active:scale-98 transition-all"
                            >
                                <span>Message Management</span>
                                <ArrowRight className="size-3" />
                            </Link>
                            <Link
                                href="/mobile/tenant/maintenance"
                                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-foreground text-xs font-bold text-center flex items-center justify-center gap-1 active:scale-98 transition-all"
                            >
                                <span>Maintenance</span>
                                <Wrench className="size-3" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
