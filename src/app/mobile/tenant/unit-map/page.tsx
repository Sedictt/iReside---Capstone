'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Map } from 'lucide-react';
import VisualBuilder from '@/components/landlord/visual-planner/VisualBuilder';
import { VisualPlannerSkeleton } from '@/components/landlord/visual-planner/components/VisualPlannerSkeleton';
import { TenantMapNotReady } from '@/components/tenant/TenantMapNotReady';
import { MobileHeader } from '@/components/mobile/layout/MobileHeader';
import { useLanguageContext } from '@/context/LanguageContext';
import { tr } from '@/hooks/useLanguage';

interface TenantUnitMapData {
    property: { id: string; name: string; address: string };
    leaseId: string;
    landlordId: string;
    tenantId: string;
    currentUnitId: string;
    currentUnitName: string;
    units: Array<{
        id: string;
        name: string;
        floor: number;
        status: string;
        beds: number;
        baths: number;
        sqft: number | null;
        rent_amount: number;
    }>;
    isSetupComplete?: boolean;
    isFullyPlaced?: boolean;
    isCurrentUnitPlaced?: boolean;
    placedCount?: number;
    totalUnits?: number;
}

export default function MobileTenantUnitMapPage() {
    const { t } = useLanguageContext();
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [unitMapData, setUnitMapData] = useState<TenantUnitMapData | null>(null);

    const fetchUnitMap = useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) {
            setIsRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const res = await fetch('/api/tenant/unit-map', {
                cache: 'no-store',
            });
            const data = await res.json();

            if (!res.ok) {
                setError(tr(data.error || 'Failed to load unit map'));
                return;
            }

            if (!data.property) {
                setError(tr('No active lease found for this account'));
                return;
            }

            setUnitMapData(data);
        } catch (err) {
            console.error('Mobile tenant unit map load error:', err);
            setError(err instanceof Error ? tr(err.message) : tr('An error occurred while loading the unit map.'));
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchUnitMap();
    }, [fetchUnitMap]);

    if (loading) {
        return (
            <div className="flex-1 min-h-0 h-full w-full overflow-hidden">
                <VisualPlannerSkeleton />
            </div>
        );
    }

    if (error || !unitMapData) {
        return (
            <div className="flex flex-col flex-1 min-h-0">
                <MobileHeader
                    title={t('Unit Map')}
                    showBack={true}
                    backHref="/mobile/tenant/home"
                />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="rounded-3xl bg-card border border-border/60 p-6 text-center space-y-4 shadow-sm max-w-sm w-full">
                        <div className="mx-auto size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                            <Map className="size-6" />
                        </div>
                        <div className="space-y-1.5">
                            <h2 className="text-base font-bold text-foreground">
                                {error || t('No unit map found')}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {t('You need an active lease to view your unit map.')}
                            </p>
                        </div>
                        <Link
                            href="/mobile/tenant/home"
                            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold active:scale-95 transition-transform"
                        >
                            {t('Back to Home')}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const isMapSetup = Boolean(
        unitMapData &&
        unitMapData.isSetupComplete &&
        unitMapData.isFullyPlaced &&
        unitMapData.placedCount &&
        unitMapData.placedCount > 0
    );

    if (!isMapSetup) {
        return (
            <TenantMapNotReady
                propertyName={unitMapData.property.name}
                propertyAddress={unitMapData.property.address}
                currentUnitName={unitMapData.currentUnitName}
                onRefresh={() => fetchUnitMap(true)}
                isRefreshing={isRefreshing}
                backHref="/mobile/tenant/home"
                messagesHref="/mobile/tenant/messages"
            />
        );
    }

    return (
        <div className="flex-1 min-h-0 h-full w-full overflow-hidden">
            <VisualBuilder
                readOnly
                mobileEmbedded
                propertyId={unitMapData.property.id}
                propertyName={unitMapData.property.name}
                propertyAddress={unitMapData.property.address}
                currentUnitId={unitMapData.currentUnitId}
                showBackButton={true}
            />
        </div>
    );
}
