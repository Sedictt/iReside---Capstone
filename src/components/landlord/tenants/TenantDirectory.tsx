'use client'

import { useState, useMemo } from "react"
import { AnimatePresence } from "framer-motion"
import { AlertCircle, Users } from "lucide-react"
import { Tenant, TenantCard, TenantStatus } from "./TenantCard"
import { TenantFilterBar } from "./TenantFilterBar"

interface TenantDirectoryProps {
    tenants: Tenant[]
    loading: boolean
    error: string | null
    onViewProfile: (id: string) => void
}

export function TenantDirectory({ tenants, loading, error, onViewProfile }: TenantDirectoryProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<TenantStatus | "All">("All")

    const filteredTenants = useMemo(() => {
        return tenants.filter(tenant => {
            const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tenant.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tenant.property.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesStatus = statusFilter === "All" || tenant.status === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [tenants, searchQuery, statusFilter])

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-red-500/10 bg-red-500/5 py-12 text-center">
                <AlertCircle className="mb-4 size-12 text-red-500" />
                <h3 className="text-lg font-semibold text-red-700">Failed to load tenants</h3>
                <p className="mt-1 text-sm text-red-600/70">{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="mt-6 rounded-xl bg-red-500 px-6 py-2 text-sm font-bold text-white hover:bg-red-600"
                >
                    Try Again
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <TenantFilterBar 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
            />

            {loading ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={`skeleton-${i}`} className="h-72 animate-pulse rounded-3xl border border-border bg-muted/40" />
                    ))}
                </div>
            ) : (
                <div data-tour-id="tour-tenant-hub" className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                        {filteredTenants.map((tenant, idx) => (
                            <TenantCard 
                                key={tenant.id}
                                tenant={tenant}
                                idx={idx}
                                onViewProfile={onViewProfile}
                            />
                        ))}
                    </AnimatePresence>

                    {filteredTenants.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-border bg-muted/10 py-24 text-center">
                            <div className="mb-4 rounded-full bg-muted p-6">
                                <Users className="size-10 text-muted-foreground/40" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground">No residents found</h3>
                            <p className="mt-2 text-muted-foreground">Adjust your search or filters to find what you&apos;re looking for.</p>
                            <button 
                                onClick={() => { setSearchQuery(""); setStatusFilter("All"); }}
                                className="mt-6 rounded-xl border border-border px-6 py-2 text-sm font-bold hover:bg-muted"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

