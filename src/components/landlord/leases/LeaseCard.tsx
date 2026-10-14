"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguageContext } from "@/context/LanguageContext";
import {
 formatLeaseDate,
 formatTenure,
 formatTenureShort,
 leaseDateRangeLabel,
 leaseEndState,
 leaseProgressPercent,
 parseLeaseDate,
 type LeaseEndState,
} from "@/lib/lease-term";
import { LeaseTermSwitchDialog, type LeaseTermUpdate } from "./LeaseTermSwitchDialog";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
 Building2,
 User,
 Calendar,
 ArrowRight,
 Clock,
 Mail,
 MoreVertical,
 CheckCircle2,
 FileText,
 History,
 Trash2,
 Infinity as InfinityIcon,
 CalendarRange,
 LogOut,
} from "lucide-react";
import { LeaseStatusBadge } from "./LeaseStatusBadge";
import { Button } from "@/components/ui/button";
import { 
 Tooltip,
 TooltipContent,
 TooltipProvider,
 TooltipTrigger,
} from "@/components/ui/tooltip";

export interface LeaseCardData {
 id: string;
 status: string;
 start_date: string;
 /** Null for open-ended (month-to-month) leases until a move-out date is agreed. */
 end_date: string | null;
 /** "open_ended" (default) or "fixed". */
 term_type?: string | null;
 monthly_rent: number;
 security_deposit: number;
 unit: {
 id: string;
 name: string;
 beds: number;
 baths: number;
 property: {
 id: string;
 name: string;
 address: string;
 };
 };
 tenant: {
 id: string;
 full_name: string;
 email: string;
 phone: string;
 avatar_url: string | null;
 avatar_bg_color: string | null;
 } | null;
}

type CardVariant = "active" | "archive";

interface LeaseCardProps {
 lease: LeaseCardData;
 variant: CardVariant;
 onClick?: () => void;
 index?: number;
 /** Notified after the landlord switches the lease between open-ended and fixed term. */
 onTermChange?: (update: LeaseTermUpdate) => void;
}

function formatCurrency(amount: number) {
 return new Intl.NumberFormat("en-PH", {
 style: "currency",
 currency: "PHP",
 }).format(amount);
}

/** Elapsed share of a dated term (fixed term or agreed move-out). */
function LeaseTermProgress({ lease, label = "Progress" }: { lease: LeaseCardData; label?: string }) {
 const { t } = useLanguageContext();
 const progress = useMemo(() => leaseProgressPercent(lease) ?? 0, [lease]);

 return (
 <div className="space-y-1.5">
 <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
 <span>{t(label)}</span>
 <span>{progress}%</span>
 </div>
 <div className="h-1.5 w-full overflow-hidden rounded-full neumorphic-inset">
 <m.div
 initial={{ width: 0 }}
 animate={{ width: `${progress}%` }}
 transition={{ duration: 1, ease: "easeOut" }}
 className={cn(
 "h-full rounded-full",
 progress >= 90 ? "bg-amber-500" : "bg-primary"
 )}
 />
 </div>
 </div>
 );
}

/** Meter-less row for open-ended leases: tenure instead of a countdown. */
function OpenEndedTenureRow({ lease, showTenure = true }: { lease: LeaseCardData; showTenure?: boolean }) {
 const { t, locale, language } = useLanguageContext();
 const startDate = parseLeaseDate(lease.start_date);
 const since = startDate
 ? t("Since {date}", { date: startDate.toLocaleDateString(locale, { month: "short", year: "numeric" }) })
 : "";
 const tenure = showTenure ? formatTenure(lease.start_date, undefined, language) : "";
 return (
 <div className="flex items-center justify-between gap-3 text-[10px]">
 <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-muted-foreground">
 <InfinityIcon className="size-3" />
 {t("Month-to-month")}
 </span>
 <span className="truncate font-bold text-muted-foreground/80" title={tenure ? `${since} · ${tenure}` : since}>
 {since}{tenure ? ` · ${tenure}` : ""}
 </span>
 </div>
 );
}

/** Status chip derived from the term state. Open-ended leases never count down. */
function LeaseTermChip({ state, size = "md" }: { state: LeaseEndState; size?: "sm" | "md" }) {
 const { t, language } = useLanguageContext();
 const base = cn(
 "shrink-0 flex items-center gap-1 rounded-lg font-black uppercase tracking-wider",
 size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[9px]"
 );
 const icon = size === "sm" ? "size-2.5" : "size-3";

 switch (state.kind) {
 case "open_ended":
 return (
 <span className={cn(base, "bg-primary/10 text-primary")}>
 <InfinityIcon className={icon} />
 {t("Open-ended")}
 </span>
 );
 case "moving_out":
 return (
 <span className={cn(base, "bg-amber-500/10 text-amber-600 dark:text-amber-400")}>
 <LogOut className={icon} />
 {t("Moving out {date} · {days}d", { date: formatLeaseDate(state.endDate, { month: "short", day: "numeric" }, language), days: state.daysLeft })}
 </span>
 );
 case "ended":
 return (
 <span className={cn(base, "bg-muted text-muted-foreground")}>
 <Calendar className={icon} />
 {t("Ended {date}", { date: formatLeaseDate(state.endDate, { month: "short", day: "numeric" }, language) })}
 </span>
 );
 case "fixed":
 if (!state.expiringSoon) return null;
 return (
 <span
 className={cn(
 base,
 state.urgent
 ? "bg-red-500/10 text-red-600 dark:text-red-400"
 : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
 )}
 >
 <Clock className={icon} />
 {t("{days}D to renewal", { days: state.daysLeft })}
 </span>
 );
 }
}

type TermSwitchMode = "to_open_ended" | "to_fixed";

/**
 * Local term state + the switch dialog. The card updates optimistically from the
 * API response and also notifies the parent so lists can refetch.
 */
function useLeaseTermSwitch(lease: LeaseCardData, onTermChange?: (update: LeaseTermUpdate) => void) {
 const { t } = useLanguageContext();
 const [override, setOverride] = useState<Pick<LeaseCardData, "term_type" | "end_date"> | null>(null);
 const [switchMode, setSwitchMode] = useState<TermSwitchMode | null>(null);

 // Drop the optimistic override once fresh data for this lease arrives.
 useEffect(() => {
 setOverride(null);
 }, [lease.id, lease.term_type, lease.end_date]);

 const current = useMemo<LeaseCardData>(() => (override ? { ...lease, ...override } : lease), [lease, override]);
 const state = useMemo(() => leaseEndState(current), [current]);
 const isActive = current.status === "active";
 const canSwitchToOpenEnded = isActive && state.kind === "fixed";
 const canSetFixedEnd = isActive && state.kind === "open_ended";

 const handleUpdated = useCallback(
 (update: LeaseTermUpdate) => {
 setOverride({ term_type: update.term_type, end_date: update.end_date });
 onTermChange?.(update);
 },
 [onTermChange]
 );

 const menuItems = (
 <>
 {canSwitchToOpenEnded && (
 <DropdownMenuItem
 onClick={(e) => {
 e.stopPropagation();
 setSwitchMode("to_open_ended");
 }}
 >
 <InfinityIcon className="mr-2 size-4" />
 {t("Switch to open-ended")}
 </DropdownMenuItem>
 )}
 {canSetFixedEnd && (
 <DropdownMenuItem
 onClick={(e) => {
 e.stopPropagation();
 setSwitchMode("to_fixed");
 }}
 >
 <CalendarRange className="mr-2 size-4" />
 {t("Set a fixed end date")}
 </DropdownMenuItem>
 )}
 </>
 );

 const dialog = (
 <LeaseTermSwitchDialog
 open={switchMode !== null}
 mode={switchMode ?? "to_open_ended"}
 lease={{
 id: current.id,
 start_date: current.start_date,
 end_date: current.end_date,
 term_type: current.term_type,
 status: current.status,
 tenantName: current.tenant?.full_name ?? null,
 }}
 onClose={() => setSwitchMode(null)}
 onUpdated={handleUpdated}
 />
 );

 return { current, state, menuItems, dialog };
}

const getAvatarStyles = (tenant?: LeaseCardData["tenant"]) => {
 if (!tenant) return { className: "neumorphic-inset text-muted-foreground" };
 
 // If it's a hex color (starts with #), we'll return it for the style prop
 if (tenant.avatar_bg_color?.startsWith("#")) {
 return { 
 style: { backgroundColor: tenant.avatar_bg_color },
 className: "text-white " // Default text color for hex backgrounds
 };
 }

 // If it's a tailwind class, return it as className
 if (tenant.avatar_bg_color) {
 return { className: tenant.avatar_bg_color };
 }

 const colors = [
 "bg-blue-500/10 text-blue-600 dark:text-blue-400",
 "bg-purple-500/10 text-purple-600 dark:text-purple-400",
 "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
 "bg-amber-500/10 text-amber-600 dark:text-amber-400",
 "bg-pink-500/10 text-pink-600 dark:text-pink-400",
 "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
 ];
 const index = tenant.full_name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
 return { className: colors[index % colors.length] };
};

export function LeaseCard({ lease: leaseProp, variant, onClick, index = 0, onTermChange }: LeaseCardProps) {
 const isArchive = variant === "archive";
 const { current: lease, state: termState, menuItems: termMenuItems, dialog: termDialog } = useLeaseTermSwitch(leaseProp, onTermChange);
 const { t, language } = useLanguageContext();
 const avatarStyles = useMemo(() => getAvatarStyles(lease.tenant), [lease.tenant]);

 return (
 <>
 {termDialog}
 <m.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 whileHover={{ y: -2 }}
 transition={{ delay: index * 0.05 }}
 onClick={onClick}
 onKeyDown={(e) => {
 if (e.key === "Enter" || e.key === " ") {
 e.preventDefault();
 onClick?.();
 }
 }}
 role="button"
 tabIndex={0}
 className={cn(
 "group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-[2.5rem] neumorphic-extruded p-7 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary",
 "hover:border-primary/50 hover:neumorphic-inset",
 isArchive && "opacity-70 grayscale-[0.3]"
 )}
 >
 {/* Top Section: Primary Hierarchy (Tenant Avatar + Info) */}
 <div className="mb-6 flex items-center gap-4">
 <div className="relative shrink-0">
 <div 
 style={avatarStyles.style}
 className={cn(
 "flex size-14 items-center justify-center overflow-hidden rounded-2xl text-xl font-black transition-all group-hover:scale-105",
 avatarStyles.className
 )}
 >
 {lease.tenant?.avatar_url ? (
 <img 
 src={lease.tenant.avatar_url} 
 alt={lease.tenant.full_name} 
 className="size-full object-cover"
 />
 ) : lease.tenant ? (
 lease.tenant.full_name.charAt(0)
 ) : (
 <User className="size-6" />
 )}
 </div>
 <LeaseStatusBadge 
 status={lease.status as any} 
 dotOnly 
 className="absolute -right-1 -top-1 size-4 rounded-full border-2 border-card bg-card" 
 />
 </div>
 <div className="min-w-0 flex-1 pr-8">
 <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
 {isArchive ? t("Closed Lease") : (lease.status ? t(lease.status.replace(/_/g, " ")) : t("Status Unknown"))}
 </p>
 <h3 className="truncate text-xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">
 {lease.tenant?.full_name || t("Unassigned")}
 </h3>
 </div>

 {/* Lease Options (Discrete Top-Right) */}
 {!isArchive && (
 <div className="absolute right-4 top-4">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button 
 variant="ghost" 
 size="icon" 
 className="size-8 rounded-xl text-muted-foreground/50 hover:bg-accent hover:text-foreground transition-all"
 onClick={(e) => e.stopPropagation()}
 >
 <MoreVertical className="size-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-48">
 {lease.tenant && (
 <DropdownMenuItem onClick={(e) => {
 e.stopPropagation();
 window.location.href = `mailto:${lease.tenant?.email}`;
 }}>
 <Mail className="mr-2 size-4" />
 {t("Contact Tenant")}
 </DropdownMenuItem>
 )}
 <DropdownMenuItem onClick={(e) => {
 e.stopPropagation();
 onClick?.();
 }}>
 <FileText className="mr-2 size-4" />
 {t("View Agreement")}
 </DropdownMenuItem>
 {termMenuItems}
 <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
 <History className="mr-2 size-4" />
 {t("Lease History")}
 </DropdownMenuItem>
 <DropdownMenuItem
 className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
 onClick={(e) => e.stopPropagation()}
 >
 <Trash2 className="mr-2 size-4" />
 {t("Terminate Lease")}
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 )}
 </div>

 {/* Middle Section: Related Property Details (Proximity) */}
 <div className="mb-8 space-y-5">
 <div className="flex items-center gap-3 px-1">
 <div className="flex size-9 shrink-0 items-center justify-center rounded-xl neumorphic-inset text-muted-foreground">
 <Building2 className="size-4" />
 </div>
 <div className="min-w-0">
 <p className="truncate text-sm font-bold text-foreground">{lease.unit.property.name}</p>
 <p className="truncate text-xs font-medium text-muted-foreground">
 {lease.unit.name?.trim().toLowerCase().startsWith("unit")
  ? lease.unit.name
  : t("Unit {name}", { name: lease.unit.name })}
 </p>
 </div>
 </div>

 <div className="min-h-[40px] space-y-4">
 {!isArchive ? (
 termState.kind === "open_ended" ? (
 <div className="space-y-2">
 <div className="flex items-center justify-between gap-3">
 <div className="min-w-0">
 <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("Tenure")}</p>
 <p className="truncate text-sm font-black text-foreground">
 {formatTenure(lease.start_date, undefined, language) || t("Just moved in")}
 </p>
 </div>
 <LeaseTermChip state={termState} />
 </div>
 <OpenEndedTenureRow lease={lease} showTenure={false} />
 </div>
 ) : (
 <div className="flex items-center justify-between">
 <div className="flex-1">
 <LeaseTermProgress
 lease={lease}
 label={termState.kind === "moving_out" ? "Until move-out" : "Progress"}
 />
 </div>
 <div className="ml-4">
 <LeaseTermChip state={termState} />
 </div>
 </div>
 )
 ) : (
 <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
 <Calendar className="size-3" />
 {t("Lease Concluded")}
 </div>
 )}
 </div>
 </div>

 {/* Bottom Section: Financials & Action */}
 <div className="mt-auto flex items-end justify-between border-t border-border/50 pt-6">
 <div>
 <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 mb-1">
 {isArchive ? t("Total Settlement") : t("Monthly Rent")}
 </p>
 <p className={cn(
 "font-black tracking-tight text-foreground",
 isArchive ? "text-xl text-foreground/70" : "text-2xl"
 )}>
 {formatCurrency(lease.monthly_rent)}
 </p>
 </div>
 <div className="flex items-center gap-2">
 {isArchive ? (
 <div className="flex items-center gap-2 rounded-xl neumorphic-inset px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
 <CheckCircle2 className="size-3" />
 {t("Archived")}
 </div>
 ) : (
 <div className="flex size-11 items-center justify-center rounded-2xl neumorphic-primary/10 text-primary transition-all">
 <ArrowRight className="size-5" />
 </div>
 )}
 </div>
 </div>
 </m.div>
 </>
 );
}

export function LeaseListRow({ lease: leaseProp, variant, onClick, index = 0, onTermChange }: LeaseCardProps) {
 const isArchive = variant === "archive";
 const { current: lease, state: termState, menuItems: termMenuItems, dialog: termDialog } = useLeaseTermSwitch(leaseProp, onTermChange);
 const { t, language } = useLanguageContext();
 const avatarStyles = useMemo(() => getAvatarStyles(lease.tenant), [lease.tenant]);
 const progress = useMemo(() => leaseProgressPercent(lease), [lease]);
 const isOpenEnded = termState.kind === "open_ended";

 return (
 <>
 {termDialog}
 <m.div
 initial={{ opacity: 0, y: 6 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: index * 0.02 }}
 onClick={onClick}
 onKeyDown={(e) => {
 if (e.key === "Enter" || e.key === " ") {
 e.preventDefault();
 onClick?.();
 }
 }}
 role="button"
 tabIndex={0}
 className={cn(
 "group relative flex flex-col md:flex-row md:items-center justify-between neumorphic-panel rounded-2xl overflow-hidden hover:border-primary/40 hover:neumorphic-inset transition-all duration-200 cursor-pointer p-4 sm:p-5 gap-4 outline-none focus-visible:ring-2 focus-visible:ring-primary",
 isArchive && "opacity-75 grayscale-[0.25]"
 )}
 >
 {/* 1. Tenant Avatar & Details */}
 <div className="flex items-center gap-3.5 min-w-[220px] max-w-xs">
 <div className="relative shrink-0">
 <div
 style={avatarStyles.style}
 className={cn(
 "flex size-11 items-center justify-center overflow-hidden rounded-xl text-base font-black transition-all group-hover:scale-105",
 avatarStyles.className
 )}
 >
 {lease.tenant?.avatar_url ? (
 <img
 src={lease.tenant.avatar_url}
 alt={lease.tenant.full_name}
 className="size-full object-cover"
 />
 ) : lease.tenant ? (
 lease.tenant.full_name.charAt(0)
 ) : (
 <User className="size-5" />
 )}
 </div>
 <LeaseStatusBadge
 status={lease.status as any}
 dotOnly
 className="absolute -right-1 -top-1 size-3.5 rounded-full border-2 border-card bg-card"
 />
 </div>

 <div className="min-w-0 flex-1">
 <h4 className="truncate text-sm font-black text-foreground group-hover:text-primary transition-colors">
 {lease.tenant?.full_name || t("Unassigned")}
 </h4>
 <div className="flex items-center gap-1.5 text-[10px] font-bold">
 <span className="uppercase tracking-wider text-muted-foreground/70">
 {isArchive ? t("Closed Lease") : (lease.status ? t(lease.status.replace(/_/g, " ")) : t("Status Unknown"))}
 </span>
 {lease.tenant?.email && (
 <span className="text-muted-foreground/40 truncate max-w-[120px] hidden sm:inline">
 • {lease.tenant.email}
 </span>
 )}
 </div>
 </div>
 </div>

 {/* 2. Property & Unit Info */}
 <div className="flex items-center gap-3 min-w-[170px] max-w-xs">
 <div className="flex size-9 shrink-0 items-center justify-center rounded-xl neumorphic-inset text-muted-foreground">
 <Building2 className="size-4" />
 </div>
 <div className="min-w-0">
 <p className="truncate text-xs font-bold text-foreground">{lease.unit.property.name}</p>
 <p className="truncate text-[11px] font-semibold text-primary">
 {lease.unit.name?.trim().toLowerCase().startsWith("unit")
 ? lease.unit.name
 : t("Unit {name}", { name: lease.unit.name })}
 </p>
 </div>
 </div>

 {/* 3. Timeline / Progress */}
 <div className="flex flex-col justify-center min-w-[200px] flex-1 max-w-sm">
 <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground mb-1.5">
 <span className="flex items-center gap-1.5 min-w-0">
 <Calendar className="size-3 shrink-0 text-muted-foreground/70" />
 <span className="truncate">{leaseDateRangeLabel(lease, language)}</span>
 </span>
 {!isArchive && !isOpenEnded && progress !== null && (
 <span className="font-mono text-[10px]">{progress}%</span>
 )}
 {!isArchive && isOpenEnded && (
 <span className="shrink-0 font-bold text-muted-foreground/80" title={formatTenure(lease.start_date, undefined, language)}>
 {formatTenureShort(lease.start_date, undefined, language)}
 </span>
 )}
 </div>
 {!isArchive ? (
 isOpenEnded ? (
 <OpenEndedTenureRow lease={lease} showTenure={false} />
 ) : (
 <div className="flex items-center gap-3">
 <div className="h-1.5 flex-1 overflow-hidden rounded-full neumorphic-inset">
 <div
 className={cn(
 "h-full rounded-full transition-all duration-500",
 (progress ?? 0) >= 90 ? "bg-amber-500" : "bg-primary"
 )}
 style={{ width: `${progress ?? 0}%` }}
 />
 </div>
 <LeaseTermChip state={termState} size="sm" />
 </div>
 )
 ) : (
 <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
 {t("Lease Concluded")}
 </span>
 )}
 </div>

 {/* 4. Financials (Right-aligned, tabular-nums) & Actions */}
 <div className="flex items-center justify-between md:justify-end gap-5 shrink-0">
 <div className="text-left md:text-right">
 <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-0.5">
 {isArchive ? t("Total Settlement") : t("Monthly Rent")}
 </p>
 <p className="font-mono text-base font-black tracking-tight text-foreground tabular-nums">
 {formatCurrency(lease.monthly_rent)}
 </p>
 </div>

 {/* Action Controls */}
 <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
 {!isArchive && (
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant="ghost"
 size="icon"
 className="size-8 rounded-xl text-muted-foreground/50 hover:bg-accent hover:text-foreground transition-all cursor-pointer"
 aria-label={t("Lease actions")}
 >
 <MoreVertical className="size-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-48">
 {lease.tenant && (
 <DropdownMenuItem
 onClick={(e) => {
 e.stopPropagation();
 window.location.href = `mailto:${lease.tenant?.email}`;
 }}
 >
 <Mail className="mr-2 size-4" />
 {t("Contact Tenant")}
 </DropdownMenuItem>
 )}
 <DropdownMenuItem
 onClick={(e) => {
 e.stopPropagation();
 onClick?.();
 }}
 >
 <FileText className="mr-2 size-4" />
 {t("View Agreement")}
 </DropdownMenuItem>
 {termMenuItems}
 <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
 <History className="mr-2 size-4" />
 {t("Lease History")}
 </DropdownMenuItem>
 <DropdownMenuItem
 className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
 onClick={(e) => e.stopPropagation()}
 >
 <Trash2 className="mr-2 size-4" />
 {t("Terminate Lease")}
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 )}

 <button
 type="button"
 onClick={() => onClick?.()}
 className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all cursor-pointer group-hover:scale-105"
 aria-label={t("View Lease Details")}
 title={t("View Lease Details")}
 >
 <ArrowRight className="size-4" />
 </button>
 </div>
 </div>
 </m.div>
 </>
 );
}



