"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { Clock, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProperty } from "@/context/PropertyContext";
import { useSearchParams, useRouter } from "next/navigation";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { AddTenantModal } from "@/components/landlord/tenants/AddTenantModal";
import LandlordRenewalReview from "@/components/landlord/leases/RenewalReview";
import { useProfileCard } from "@/context/ProfileCardContext";
import { TenantDirectory } from "@/components/landlord/tenants/TenantDirectory";
import { Tenant } from "@/components/landlord/tenants/TenantCard";

function TenantsContent() {
    const { openDetailModal } = useProfileCard();
    const searchParams = useSearchParams();
    const { get } = searchParams;
    const router = useRouter();
    const { push } = router;
    const currentTab = get("tab") || "directory";

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
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Tenants Hub</h1>
                        <p className="mt-1 text-muted-foreground">Manage resident records and lease timelines across your portfolio.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-95"
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
                    <TenantDirectory 
                        tenants={tenants}
                        loading={loading}
                        error={error}
                        onViewProfile={openDetailModal}
                    />
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
