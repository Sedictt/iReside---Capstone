'use client'

import { useState, useEffect } from "react"
import { Building2, Calendar, ChevronRight, MessageSquare, MoreVertical, Wallet, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { m } from "framer-motion"
import { formatTenure, leaseEndState, leaseTermLabel } from "@/lib/lease-term"
import { useLanguageContext } from "@/context/LanguageContext"

export type TenantStatus = "Active" | "Moving Out" | "Evicted"
export type TenantPaymentStatus = "paid" | "late" | "pending"

export type Tenant = {
 id: string
 name: string
 property: string
 unit: string
 status: TenantStatus
 rentAmount: number | null
 leaseStart?: string | null
 /** Null for open-ended leases until a move-out date is agreed. */
 leaseEnd: string | null
 /** "open_ended" (default) or "fixed"; the API may use any of these keys. */
 leaseTermType?: string | null
 term_type?: string | null
 termType?: string | null
 lease_term?: string | null
 phone: string
 email: string
 avatar: string
 avatarUrl: string | null
 avatarBgColor: string | null
 paymentStatus: TenantPaymentStatus
}

interface TenantCardProps {
 tenant: Tenant
 idx: number
 onViewProfile: (id: string) => void
 onMessage: (id: string) => void
}

const getStatusStyles = (status: TenantStatus) => {
 switch (status) {
 case "Active": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
 case "Moving Out": return "bg-amber-500/10 text-amber-600 border-amber-500/20"
 case "Evicted": return "bg-red-500/10 text-red-600 border-red-500/20"
 default: return "neumorphic-inset text-muted-foreground border-border"
 }
}

const getPaymentBadge = (status: TenantPaymentStatus, t: (phrase: string) => string) => {
 switch (status) {
 case "paid": return (
 <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-600">
 <CheckCircle2 className="size-3" /> {t("Paid")}
 </div>
 )
 case "late": return (
 <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-red-600">
 <AlertCircle className="size-3" /> {t("Overdue")}
 </div>
 )
 case "pending": return (
 <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-600">
 <Clock className="size-3" /> {t("Pending")}
 </div>
 )
 default: return null
 }
}

export function TenantCard({ tenant, idx, onViewProfile, onMessage }: TenantCardProps) {
 const { t, language } = useLanguageContext()
 const [mounted, setMounted] = useState(false)

 useEffect(() => {
 const timer = setTimeout(() => setMounted(true), 0);
 return () => clearTimeout(timer);
 }, [])

 // Open-ended leases show tenure instead of an end date; dated terms show the end.
 const leaseTerm = {
 term_type: tenant.leaseTermType ?? tenant.term_type ?? tenant.termType ?? tenant.lease_term ?? null,
 end_date: tenant.leaseEnd,
 start_date: tenant.leaseStart ?? null,
 }
 const isOpenEnded = leaseEndState(leaseTerm).kind === "open_ended"
 const leaseTermDisplay = (() => {
 if (!mounted) return "---"
 if (isOpenEnded) {
 const tenure = formatTenure(leaseTerm.start_date, undefined, language)
 return tenure ? t("Open-ended · {tenure}", { tenure }) : t("Open-ended")
 }
 return leaseTermLabel(leaseTerm, undefined, language)
 })()

 return (
 <m.div
 layout
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95 }}
 transition={{ delay: idx * 0.05 }}
 className="group relative flex flex-col justify-between overflow-hidden rounded-3xl neumorphic-panel p-6 transition-all hover:border-primary/20 hover:shadow-xl dark:hover:shadow-primary/5"
 >
 {/* Card Header */}
 <div className="flex items-start justify-between">
 <div className="flex items-center gap-4">
 <div 
 className="size-16 overflow-hidden rounded-2xl flex items-center justify-center text-xl font-black text-white"
 style={{ backgroundColor: tenant.avatarBgColor || '#8B5CF6' }}
 >
 {tenant.avatarUrl ? (
 <div className="relative h-full w-full">
 <Image 
 src={tenant.avatarUrl} 
 alt={tenant.name} 
 fill
 sizes="64px"
 className="object-cover"
 unoptimized
 />
 </div>
 ) : (
 tenant.avatar
 )}
 </div>
 <div>
 <h3 className="text-lg font-black leading-tight text-foreground transition-colors group-hover:text-primary">
 {tenant.name}
 </h3>
 <p className="text-xs font-medium text-muted-foreground">{tenant.email}</p>
 </div>
 </div>
 <button className="rounded-xl p-2 text-muted-foreground transition-colors hover:neumorphic-inset hover:text-foreground">
 <MoreVertical className="size-5" />
 </button>
 </div>

 {/* Status & Payment Indicators */}
 <div className="mt-6 flex items-center justify-between gap-3">
 <div className={cn(
 "flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-tight",
 getStatusStyles(tenant.status)
 )}>
 <div className={cn("size-1.5 rounded-full bg-current")} />
 {t(tenant.status)}
 </div>
 <div className="rounded-2xl neumorphic-inset px-3 py-1">
 {getPaymentBadge(tenant.paymentStatus, t)}
 </div>
 </div>

 {/* Property Details */}
 <div className="mt-6 space-y-3 rounded-2xl neumorphic-inset p-4">
 <div className="flex items-center justify-between text-xs">
 <span className="flex items-center gap-2 text-muted-foreground">
 <Building2 className="size-3.5" /> {t("Property")}
 </span>
 <span className="font-black text-foreground truncate max-w-[140px]">{tenant.property}</span>
 </div>
 <div className="flex items-center justify-between text-xs">
 <span className="flex items-center gap-2 text-muted-foreground">
 <Wallet className="size-3.5" /> {t("Unit")}
 </span>
 <span className="font-black text-foreground">{tenant.unit}</span>
 </div>
 <div className="flex items-center justify-between text-xs">
 <span className="flex items-center gap-2 text-muted-foreground">
 <Calendar className="size-3.5" /> {t("Lease Term")}
 </span>
 <span className="font-black text-foreground truncate max-w-[160px]" title={leaseTermDisplay}>{leaseTermDisplay}</span>
 </div>
 </div>

 {/* Footer Actions */}
 <div className="mt-6 flex items-center gap-2">
 <button 
 onClick={() => onViewProfile(tenant.id)}
 className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary/10 py-2.5 text-xs font-black text-primary transition-all hover:bg-primary/20"
 >
 {t("View Profile")}
 <ChevronRight className="size-3.5" />
 </button>
 <div className="flex items-center gap-2">
 <button 
 onClick={() => onMessage(tenant.id)}
 aria-label={t("Message tenant")}
 title={t("Message tenant")}
 className="flex size-9 items-center justify-center rounded-xl neumorphic-panel text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
 >
 <MessageSquare className="size-4" />
 </button>
 </div>
 </div>
 </m.div>
 )
}
