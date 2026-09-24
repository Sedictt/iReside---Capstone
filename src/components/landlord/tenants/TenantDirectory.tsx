'use client'

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { AnimatePresence } from "framer-motion"
import { AlertCircle, Users, UserPlus } from "lucide-react"
import { Tenant, TenantCard, TenantStatus } from "./TenantCard"
import { TenantFilterBar } from "./TenantFilterBar"

interface TenantDirectoryProps {
 tenants: Tenant[]
 loading: boolean
 error: string | null
 onViewProfile: (id: string) => void
 onMessage: (id: string) => void
 onAddTenant?: () => void
}

export function TenantDirectory({ tenants, loading, error, onViewProfile, onMessage, onAddTenant }: TenantDirectoryProps) {
 const searchParams = useSearchParams();
 const [searchQuery, setSearchQuery] = useState(() => searchParams?.get("search") || "");
 const [statusFilter, setStatusFilter] = useState<TenantStatus | "All">("All");

 useEffect(() => {
  const query = searchParams?.get("search");
  if (query !== null && query !== undefined) {
   setSearchQuery(query);
  }
 }, [searchParams]);

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
 <h3 className="text-lg font-black text-red-700">Failed to load tenants</h3>
 <p className="mt-1 text-sm text-red-600/70">{error}</p>
 <button 
 onClick={() => window.location.reload()}
 className="mt-6 rounded-xl bg-red-500 px-6 py-2 text-sm font-black text-white hover:bg-red-600"
 >
 Try Again
 </button>
 </div>
 )
 }

 return (
 <div className="space-y-6">
  {loading ? (
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
  {[1, 2, 3, 4, 5, 6].map((i) => (
  <div key={`skeleton-${i}`} className="h-72 animate-pulse rounded-3xl neumorphic-inset" />
  ))}
  </div>
  ) : tenants.length === 0 ? (
  <div className="neumorphic-panel rounded-3xl py-16 px-6 text-center max-w-xl mx-auto my-6 space-y-5 animate-in fade-in duration-300">
   <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
    <Users className="size-8" />
   </div>
   <div className="space-y-2">
    <h3 className="text-2xl font-black tracking-tight text-foreground">No tenants registered yet</h3>
    <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
     Your property doesn&apos;t have any residents yet. Add your first tenant manually or share an invite link to begin tracking leases, rent collections, and maintenance.
    </p>
   </div>
   {onAddTenant && (
    <div className="pt-2">
     <button 
      type="button"
      onClick={onAddTenant}
      className="inline-flex items-center gap-2 rounded-xl neumorphic-primary px-6 py-3 text-sm font-black text-primary-foreground transition-all hover:brightness-110 active:scale-95 shadow-md shadow-primary/20 cursor-pointer"
     >
      <UserPlus className="size-4" />
      <span>Add First Tenant</span>
     </button>
    </div>
   )}
  </div>
  ) : (
  <>
  <TenantFilterBar 
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  statusFilter={statusFilter}
  onStatusFilterChange={setStatusFilter}
  />

  <div data-tour-id="tour-tenant-hub" className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
  <AnimatePresence mode="popLayout">
  {filteredTenants.map((tenant, idx) => (
  <TenantCard 
  key={tenant.id}
  tenant={tenant}
  idx={idx}
  onViewProfile={onViewProfile}
  onMessage={onMessage}
  />
  ))}
  </AnimatePresence>

  {filteredTenants.length === 0 && (
  <div className="col-span-full flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-border neumorphic-inset py-24 text-center">
  <div className="mb-4 rounded-full neumorphic-inset p-6">
  <Users className="size-10 text-muted-foreground/40" />
  </div>
  <h3 className="text-xl font-black text-foreground">No matching residents</h3>
  <p className="mt-2 text-muted-foreground">Adjust your search or filters to find what you&apos;re looking for.</p>
  <button 
  onClick={() => { setSearchQuery(""); setStatusFilter("All"); }}
  className="mt-6 rounded-xl px-6 py-2 text-sm font-black hover:neumorphic-inset"
  >
  Clear All Filters
  </button>
  </div>
  )}
  </div>
  </>
  )}
 </div>
 )
}

