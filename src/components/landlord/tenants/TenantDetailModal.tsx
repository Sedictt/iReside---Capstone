'use client'

import { useState, useEffect, useCallback } from 'react'
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion'
import { 
    X, 
    User, 
    Mail, 
    Phone, 
    Wallet,
    FileText,
    History,
    Loader2,
    Wrench,
    UserCheck,
    ExternalLink
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ClientOnlyDate } from '@/components/ui/client-only-date'

interface TenantDetailModalProps {
    isOpen: boolean
    onClose: () => void
    tenantId: string
    initialTab?: 'profile' | 'documents' | 'activity'
}

type Activity = {
    id: string
    type: string
    title: string
    status: string
    date: string
    icon: string
    amount?: number
}

type Document = {
    id: string
    name: string
    description: string
    url: string | null
    category: string
    updatedAt: string
}

interface TenantProfileInfo {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    role?: string;
}

export function TenantDetailModal({ isOpen, onClose, tenantId, initialTab = 'profile' }: TenantDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'profile' | 'documents' | 'activity'>(initialTab)
    const [loading, setLoading] = useState(true)
    const [activities, setActivities] = useState<Activity[]>([])
    const [documents, setDocuments] = useState<Document[]>([])
    const [tenantInfo, setTenantInfo] = useState<TenantProfileInfo | null>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const fetchData = useCallback(async () => {
        if (!tenantId) return
        setLoading(true)
        try {
            const [activityRes, docRes] = await Promise.all([
                fetch(`/api/landlord/tenants/${tenantId}/activity`),
                fetch(`/api/landlord/documents?tenantId=${tenantId}`)
            ])

            const activityData = await activityRes.json()
            const docData = await docRes.json()

            if (activityRes.ok) setActivities(activityData.activities)
            if (docRes.ok) {
                setDocuments(docData.documents)
                setTenantInfo(docData.profile)
            }
        } catch (error) {
            console.error('Error fetching tenant details:', error)
            toast.error('Failed to load tenant details')
        } finally {
            setLoading(false)
        }
    }, [tenantId])

    useEffect(() => {
        if (isOpen && tenantId) {
            const initModal = async () => {
                setActiveTab(initialTab)
                await fetchData()
            }
            initModal()
        }
    }, [isOpen, tenantId, fetchData, initialTab])

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'Wrench': return <Wrench className="size-4" />
            case 'Wallet': return <Wallet className="size-4" />
            case 'FileText': return <FileText className="size-4" />
            case 'UserCheck': return <UserCheck className="size-4" />
            default: return <History className="size-4" />
        }
    }

    if (!isOpen) return null

    return (
        <LazyMotion features={domAnimation}>
            <AnimatePresence>
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-background/80 backdrop-blur-md"
                    />
                    
                    <m.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-3xl overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-8 pt-6 pb-2">
                            <div className="flex items-center gap-4">
                                <div className="size-12 overflow-hidden rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    {tenantInfo?.avatar_url ? (
                                        <Image src={tenantInfo.avatar_url} alt="Avatar" width={48} height={48} className="object-cover" />
                                    ) : (
                                        <User className="size-6" />
                                    )}
                                </div>
                                <div className="space-y-0.5">
                                    <h2 className="text-xl font-bold tracking-tight text-foreground">{tenantInfo?.full_name || 'Resident Details'}</h2>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                        {tenantInfo?.phone || 'Loading...'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-2xl bg-muted p-3 text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 border-b border-border bg-muted/30 px-8 py-4">
                            {[
                                { id: 'profile', label: 'Overview', icon: User },
                                { id: 'documents', label: 'Documents', icon: FileText },
                                { id: 'activity', label: 'Activity', icon: History },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as 'profile' | 'documents' | 'activity')}
                                    className={cn(
                                        "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all",
                                        activeTab === tab.id 
                                            ? "bg-foreground text-background shadow-md"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <tab.icon className="size-3.5" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="max-h-[70vh] min-h-[400px] overflow-y-auto p-8">
                            {loading ? (
                                <div className="flex h-[300px] flex-col items-center justify-center gap-4">
                                    <Loader2 className="size-8 animate-spin text-primary" />
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Gathering records...</p>
                                </div>
                            ) : (
                                <>
                                    {activeTab === 'profile' && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <div className="grid gap-6 sm:grid-cols-2">
                                                <div className="space-y-4 rounded-3xl border border-border bg-muted/20 p-6">
                                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">Contact Information</h3>
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-3 text-sm">
                                                            <Mail className="size-4 text-muted-foreground" />
                                                            <span className="font-bold">{tenantInfo?.email || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-sm">
                                                            <Phone className="size-4 text-muted-foreground" />
                                                            <span className="font-bold">{tenantInfo?.phone || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-4 rounded-3xl border border-border bg-muted/20 p-6">
                                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">Trust Level</h3>
                                                    <div className="flex items-center gap-4">
                                                        <div className="size-12 rounded-full border-4 border-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-xs">
                                                            98
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-foreground">Verified Resident</p>
                                                            <p className="text-[10px] text-muted-foreground">Active on iReside since 2024</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Recent History</h3>
                                                <div className="space-y-3">
                                                    {activities.slice(0, 3).map(activity => (
                                                        <div key={activity.id} className="flex items-center justify-between rounded-2xl border border-border bg-muted/10 p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="size-8 rounded-lg bg-background flex items-center justify-center text-muted-foreground">
                                                                    {getIcon(activity.icon)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-foreground">{activity.title}</p>
                                                                    <p className="text-[10px] text-muted-foreground">
                                                                        <ClientOnlyDate date={activity.date} />
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{activity.status}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'documents' && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            {documents.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                                    <FileText className="size-12 text-muted-foreground/20 mb-4" />
                                                    <p className="text-sm font-bold text-muted-foreground">No documents shared yet.</p>
                                                </div>
                                            ) : (
                                                <div className="grid gap-4">
                                                    {documents.map(doc => (
                                                        <div key={doc.id} className="group flex items-center justify-between rounded-3xl border border-border bg-card p-5 transition-all hover:border-primary/20 hover:shadow-lg">
                                                            <div className="flex items-center gap-4">
                                                                <div className="size-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                                    <FileText className="size-6" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-sm font-bold text-foreground">{doc.name}</h4>
                                                                    <p className="text-xs text-muted-foreground">{doc.description}</p>
                                                                </div>
                                                            </div>
                                                            {doc.url ? (
                                                                <a 
                                                                    href={doc.url} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="size-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all"
                                                                >
                                                                    <ExternalLink className="size-4" />
                                                                </a>
                                                            ) : (
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Pending</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'activity' && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <div className="relative space-y-6 pl-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                                                {activities.map((activity, idx) => (
                                                    <div key={activity.id} className="relative">
                                                        <div className={cn(
                                                            "absolute -left-[29px] top-0 size-6 rounded-full border-4 border-card flex items-center justify-center text-[10px]",
                                                            idx === 0 ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground"
                                                        )}>
                                                            {getIcon(activity.icon)}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-sm font-bold text-foreground">{activity.title}</p>
                                                                <p className="text-[10px] font-bold text-muted-foreground">
                                                                    <ClientOnlyDate date={activity.date} format={{ month: 'short', day: 'numeric', year: 'numeric' }} />
                                                                </p>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">{activity.status}</p>
                                                            {activity.amount && (
                                                                <p className="text-xs font-bold text-emerald-600">₱{activity.amount.toLocaleString()}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-border bg-muted/30 p-8 flex justify-end">
                            <button
                                onClick={onClose}
                                className="rounded-2xl bg-foreground px-8 py-3 text-sm font-bold text-background transition-all hover:bg-foreground/90 active:scale-95"
                            >
                                Close View
                            </button>
                        </div>
                    </m.div>
                </div>
            </AnimatePresence>
        </LazyMotion>
    )
}
