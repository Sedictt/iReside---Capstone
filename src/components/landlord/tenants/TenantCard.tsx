'use client'

import { useState, useEffect } from "react"
import { Building2, Calendar, ChevronRight, MessageSquare, MoreVertical, Wallet, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { m } from "framer-motion"

export type TenantStatus = "Active" | "Moving Out" | "Evicted"
export type TenantPaymentStatus = "paid" | "late" | "pending"

export type Tenant = {
    id: string
    name: string
    property: string
    unit: string
    status: TenantStatus
    rentAmount: number | null
    leaseEnd: string | null
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
}

const getStatusStyles = (status: TenantStatus) => {
    switch (status) {
        case "Active": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
        case "Moving Out": return "bg-amber-500/10 text-amber-600 border-amber-500/20"
        case "Evicted": return "bg-red-500/10 text-red-600 border-red-500/20"
        default: return "bg-muted text-muted-foreground border-border"
    }
}

const getPaymentBadge = (status: TenantPaymentStatus) => {
    switch (status) {
        case "paid": return (
            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-600">
                <CheckCircle2 className="size-3" /> Paid
            </div>
        )
        case "late": return (
            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-red-600">
                <AlertCircle className="size-3" /> Overdue
            </div>
        )
        case "pending": return (
            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-600">
                <Clock className="size-3" /> Pending
            </div>
        )
        default: return null
    }
}

export function TenantCard({ tenant, idx, onViewProfile }: TenantCardProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(t);
    }, [])

    const formatLeaseEnd = (value: string | null) => {
        if (!value) return "No end date"
        if (!mounted) return "---"
        const parsed = new Date(value)
        if (Number.isNaN(parsed.getTime())) return "Invalid date"
        return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    }

    return (
        <m.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-xl dark:hover:shadow-primary/5"
        >
            {/* Card Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div 
                        className="size-16 overflow-hidden rounded-2xl border-2 border-background shadow-inner flex items-center justify-center text-xl font-black text-white"
                        style={{ backgroundColor: tenant.avatarBgColor || '#6d9838' }}
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
                <button className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
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
                    {tenant.status}
                </div>
                <div className="rounded-2xl bg-muted/50 px-3 py-1">
                    {getPaymentBadge(tenant.paymentStatus)}
                </div>
            </div>

            {/* Property Details */}
            <div className="mt-6 space-y-3 rounded-2xl bg-muted/30 p-4">
                <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="size-3.5" /> Property
                    </span>
                    <span className="font-black text-foreground truncate max-w-[140px]">{tenant.property}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-muted-foreground">
                        <Wallet className="size-3.5" /> Unit
                    </span>
                    <span className="font-black text-foreground">{tenant.unit}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="size-3.5" /> Lease Ends
                    </span>
                    <span className="font-black text-foreground">{formatLeaseEnd(tenant.leaseEnd)}</span>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-6 flex items-center gap-2">
                <button 
                    onClick={() => onViewProfile(tenant.id)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary/10 py-2.5 text-xs font-black text-primary transition-all hover:bg-primary/20"
                >
                    View Profile
                    <ChevronRight className="size-3.5" />
                </button>
                <div className="flex items-center gap-2">
                    <button className="flex size-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary">
                        <MessageSquare className="size-4" />
                    </button>
                </div>
            </div>
        </m.div>
    )
}
