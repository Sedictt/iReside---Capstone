"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { Clock, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProperty } from "@/context/PropertyContext";
import { useSearchParams, useRouter } from "next/navigation";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { AddTenantModal } from "@/components/landlord/tenants/AddTenantModal";
import { TenantSetupPromptModal } from "@/components/landlord/dashboard/TenantSetupPromptModal";
import LandlordRenewalReview from "@/components/landlord/leases/RenewalReview";
import { TenantDirectory } from "@/components/landlord/tenants/TenantDirectory";
import { TenantProfileView } from "@/components/landlord/tenants/TenantProfileView";
import { Tenant } from "@/components/landlord/tenants/TenantCard";
import { createOrGetDirectConversation } from "@/lib/messages/client";
import { useInstantData } from "@/lib/hooks/useInstantData";

function TenantsContent() {
 const searchParams = useSearchParams();
 const router = useRouter();
 const { push } = router;
 const currentTab = searchParams.get("tab") || "directory";
 const rawTenantId = searchParams.get("tenantId");
 const isValidUuid = (id: string | null) => id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
 const viewProfileTenantId = searchParams.get("view") === "profile" && isValidUuid(rawTenantId) ? rawTenantId : null;

 useEffect(() => {
 if (searchParams.get("view") === "profile" && !isValidUuid(rawTenantId) && rawTenantId) {
 // Invalid UUID in URL - redirect to tenant list
 const params = new URLSearchParams(searchParams.toString());
 params.delete("view");
 params.delete("tenantId");
 push(`/landlord/tenants?${params.toString()}`);
 }
 }, [searchParams, rawTenantId, push]);

 const { selectedPropertyId, properties, loading: propertyLoading, refreshProperties } = useProperty();
 const {
     data: tenantsData,
     isLoading: loading,
     error: fetchError,
     refetch: loadTenants,
 } = useInstantData<Tenant[]>({
     key: `landlord_tenants_${selectedPropertyId || "all"}`,
     fetcher: async (signal) => {
         const params = new URLSearchParams(
             selectedPropertyId && selectedPropertyId !== "all"
                 ? { propertyId: selectedPropertyId }
                 : {}
         );
         const response = await fetch(`/api/landlord/tenants?${params.toString()}`, {
             method: "GET",
             signal,
         });
         if (!response.ok) throw new Error("Failed to load tenants");
         const payload = (await response.json()) as { tenants?: Tenant[] };
         return Array.isArray(payload.tenants) ? payload.tenants : [];
     },
 });

 const tenants = tenantsData ?? [];
 const error = fetchError?.message ?? null;
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [isTenantSetupPromptOpen, setIsTenantSetupPromptOpen] = useState(false);
 const [dismissedThisVisit, setDismissedThisVisit] = useState(false);
 const [addTenantModalTab, setAddTenantModalTab] = useState<'manual' | 'invite'>('manual');
 const tenantSetupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

 const activePropertyId = selectedPropertyId && selectedPropertyId !== "all"
  ? selectedPropertyId
  : (properties[0]?.id || "default");
 const currentProperty = properties.find(p => p.id === activePropertyId) || properties[0];
 const SCOPED_TENANT_DELAYED_KEY = `ireside.tenant_setup_delayed.${activePropertyId}`;

 useEffect(() => {
  setDismissedThisVisit(false);
 }, [activePropertyId]);

 const hasConfiguredMap = Boolean(
  currentProperty?.isMapSetupComplete ||
  (currentProperty && (currentProperty.placedCount ?? 0) > 0) ||
  (typeof window !== "undefined" && (
   window.localStorage.getItem(`ireside_map_setup_complete_${activePropertyId}`) === "true" ||
   window.localStorage.getItem(`ireside.onboarding_awaiting_tenant_setup.${activePropertyId}`) === "true" ||
   window.localStorage.getItem(`ireside.awaiting_tenant_setup.${activePropertyId}`) === "true" ||
   window.localStorage.getItem(`ireside.tenant_setup_delayed.${activePropertyId}`) === "true"
  ))
 );

 const hasAtLeastOneTenant = Boolean(
  (tenants && tenants.length > 0) ||
  currentProperty?.hasTenants ||
  properties.some(p => p.hasTenants)
 );

 useEffect(() => {
  if (loading || propertyLoading) return;
  if (typeof window === "undefined") return;

  if (hasConfiguredMap && !hasAtLeastOneTenant && !dismissedThisVisit) {
   if (tenantSetupTimeoutRef.current) {
    clearTimeout(tenantSetupTimeoutRef.current);
   }
   tenantSetupTimeoutRef.current = setTimeout(() => {
    setIsTenantSetupPromptOpen(true);
   }, 1200);
  } else {
   if (tenantSetupTimeoutRef.current) {
    clearTimeout(tenantSetupTimeoutRef.current);
    tenantSetupTimeoutRef.current = null;
   }
   setIsTenantSetupPromptOpen(false);
  }

  return () => {
   if (tenantSetupTimeoutRef.current) {
    clearTimeout(tenantSetupTimeoutRef.current);
    tenantSetupTimeoutRef.current = null;
   }
  };
 }, [loading, propertyLoading, hasConfiguredMap, hasAtLeastOneTenant, dismissedThisVisit]);

 const handleCloseTenantSetupPrompt = () => {
  if (tenantSetupTimeoutRef.current) {
   clearTimeout(tenantSetupTimeoutRef.current);
   tenantSetupTimeoutRef.current = null;
  }
  setDismissedThisVisit(true);
  setIsTenantSetupPromptOpen(false);
  if (typeof window !== "undefined") {
   try {
    window.localStorage.setItem(SCOPED_TENANT_DELAYED_KEY, "true");
    window.dispatchEvent(new CustomEvent("tenant-setup-delayed-changed"));
   } catch {}
  }
 };

 const handleMaybeLaterTenantSetup = () => {
  if (tenantSetupTimeoutRef.current) {
   clearTimeout(tenantSetupTimeoutRef.current);
   tenantSetupTimeoutRef.current = null;
  }
  setDismissedThisVisit(true);
  setIsTenantSetupPromptOpen(false);
  if (typeof window !== "undefined") {
   try {
    window.localStorage.setItem(SCOPED_TENANT_DELAYED_KEY, "true");
    window.dispatchEvent(new CustomEvent("tenant-setup-delayed-changed"));
   } catch {}
  }
 };

 const handleSelectReusableLink = () => {
  if (tenantSetupTimeoutRef.current) {
   clearTimeout(tenantSetupTimeoutRef.current);
   tenantSetupTimeoutRef.current = null;
  }
  setDismissedThisVisit(true);
  setIsTenantSetupPromptOpen(false);
  setAddTenantModalTab('invite');
  setIsModalOpen(true);
 };

 const handleSelectAddManually = () => {
  if (tenantSetupTimeoutRef.current) {
   clearTimeout(tenantSetupTimeoutRef.current);
   tenantSetupTimeoutRef.current = null;
  }
  setDismissedThisVisit(true);
  setIsTenantSetupPromptOpen(false);
  setAddTenantModalTab('manual');
  setIsModalOpen(true);
 };

 const setTab = (tab: string) => {
 const params = new URLSearchParams(searchParams.toString());
 params.set("tab", tab);
 push(`/landlord/tenants?${params.toString()}`);
 };

 const handleMessageTenant = async (tenantId: string) => {
 try {
 const conversationId = await createOrGetDirectConversation(tenantId);
 push(`/landlord/messages?conversation=${conversationId}`);
 } catch (error) {
 console.error("Failed to start conversation:", error);
 }
 };

 const handleViewProfile = (tenantId: string) => {
 const params = new URLSearchParams(searchParams.toString());
 params.set("view", "profile");
 params.set("tenantId", tenantId);
 push(`/landlord/tenants?${params.toString()}`);
 };

 const handleCloseProfile = () => {
 const params = new URLSearchParams(searchParams.toString());
 params.delete("view");
 params.delete("tenantId");
 push(`/landlord/tenants?${params.toString()}`);
 };

 return (
 <LazyMotion features={domAnimation}>
 <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
 <AddTenantModal 
  isOpen={isModalOpen}
  initialTab={addTenantModalTab}
  onClose={() => setIsModalOpen(false)}
  onSuccess={() => {
   if (typeof window !== "undefined") {
    try {
     window.localStorage.removeItem(SCOPED_TENANT_DELAYED_KEY);
     window.localStorage.removeItem(`ireside.onboarding_awaiting_tenant_setup.${activePropertyId}`);
     window.localStorage.removeItem(`ireside.awaiting_tenant_setup.${activePropertyId}`);
     window.dispatchEvent(new CustomEvent("tenant-setup-delayed-changed"));
    } catch {}
   }
   void loadTenants();
   void refreshProperties();
  }}
 />

 <TenantSetupPromptModal
  isOpen={isTenantSetupPromptOpen}
  onClose={handleCloseTenantSetupPrompt}
  onSelectReusableLink={handleSelectReusableLink}
  onSelectAddManually={handleSelectAddManually}
  onMaybeLater={handleMaybeLaterTenantSetup}
  propertyName={currentProperty?.name}
 />

 {/* Header Block */}
 <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
 <div>
 <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">Tenants Hub</h1>
 <p className="mt-1 text-muted-foreground">Manage resident records and lease timelines across your portfolio.</p>
 </div>
 <div className="flex items-center gap-3">
 <button 
  onClick={() => {
   setAddTenantModalTab('manual');
   setIsModalOpen(true);
  }}
  className="inline-flex items-center gap-2 rounded-xl neumorphic-primary px-5 py-2.5 text-sm font-black transition-all hover:bg-primary/90 active:scale-95"
 >
 <UserPlus className="size-4" />
 <span>Add New Tenant</span>
 </button>
 </div>
 </div>

 {/* Tab Switcher */}
 <div className="flex items-center gap-1 border-b border-white/5">
 {[
 { id: "directory", label: "Directory", icon: Users },
 { id: "renewals", label: "Lease Renewals", icon: Clock },
 ].map((tab) => (
 <button
 key={tab.id}
 onClick={() => setTab(tab.id)}
 className={cn(
 "flex items-center gap-2 px-6 py-4 text-sm font-black uppercase tracking-widest transition-all relative",
 currentTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
 )}
 >
 <tab.icon className="size-4" />
 {tab.label}
 {currentTab === tab.id && (
 <m.div 
 layoutId="activeTab"
 className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"
 />
 )}
 </button>
 ))}
 </div>

 {currentTab === "directory" ? (
 viewProfileTenantId ? (
 <TenantProfileView
 tenantId={viewProfileTenantId}
 onClose={handleCloseProfile}
 onMessage={handleMessageTenant}
 />
 ) : (
 <TenantDirectory
 tenants={tenants}
 loading={loading}
 error={error}
 onViewProfile={handleViewProfile}
 onMessage={handleMessageTenant}
 onAddTenant={() => {
  setAddTenantModalTab('manual');
  setIsModalOpen(true);
 }}
 />
 )
 ) : (
 <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
 <LandlordRenewalReview />
 </div>
 )}
 </div>
 </LazyMotion>
 );
}

export default function TenantsPage() {
 return (
 <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading Hub...</div>}>
 <TenantsContent />
 </Suspense>
 );
}
