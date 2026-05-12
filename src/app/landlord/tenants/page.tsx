"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { Clock, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProperty } from "@/context/PropertyContext";
import { useSearchParams, useRouter } from "next/navigation";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { AddTenantModal } from "@/components/landlord/tenants/AddTenantModal";
import LandlordRenewalReview from "@/components/landlord/leases/RenewalReview";
import { TenantDirectory } from "@/components/landlord/tenants/TenantDirectory";
import { TenantProfileView } from "@/components/landlord/tenants/TenantProfileView";
import { Tenant } from "@/components/landlord/tenants/TenantCard";
import { createOrGetDirectConversation } from "@/lib/messages/client";

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

    const { selectedPropertyId } = useProperty();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const loadTenants = useCallback(async (controller?: AbortController) => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({ propertyId: selectedPropertyId });
            const response = await fetch(`/api/landlord/tenants?${params.toString()}`, {
                method: "GET",
                signal: controller?.signal,
            });

            if (!response.ok) {
                throw new Error("Failed to load tenants");
            }

            const payload = (await response.json()) as { tenants?: Tenant[] };
            if (!controller?.signal.aborted) {
                setTenants(Array.isArray(payload.tenants) ? payload.tenants : []);
            }
        } catch (fetchError) {
            if ((fetchError as Error).name === "AbortError") {
                return;
            }

            if (!controller?.signal.aborted) {
                setError("Unable to load tenants right now.");
                setTenants([]);
            }
        } finally {
            if (!controller?.signal.aborted) {
                setLoading(false);
            }
        }
    }, [selectedPropertyId]);

    useEffect(() => {
        const controller = new AbortController();
        void loadTenants(controller);

        return () => {
            controller.abort();
        };
    }, [selectedPropertyId, loadTenants]);

    return (
        <LazyMotion features={domAnimation}>
            <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
                <AddTenantModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => void loadTenants()}
                />

                {/* Header Block */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">Tenants Hub</h1>
                        <p className="mt-1 text-muted-foreground">Manage resident records and lease timelines across your portfolio.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-95"
                        >
                            <UserPlus className="size-4" />
                            <span>Add New Tenant</span>
                        </button>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center gap-1 border-b border-border">
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
                        />
                    ) : (
                        <TenantDirectory
                            tenants={tenants}
                            loading={loading}
                            error={error}
                            onViewProfile={handleViewProfile}
                            onMessage={handleMessageTenant}
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
