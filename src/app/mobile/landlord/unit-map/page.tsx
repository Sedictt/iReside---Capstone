'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Building2, ChevronRight, Map } from 'lucide-react';
import VisualBuilder from '@/components/landlord/visual-planner/VisualBuilder';
import { VisualPlannerSkeleton } from '@/components/landlord/visual-planner/components/VisualPlannerSkeleton';
import { MobileHeader } from '@/components/mobile/layout/MobileHeader';
import { useProperty } from '@/context/PropertyContext';
import { useLanguageContext } from '@/context/LanguageContext';

function MobileUnitMapContent() {
    const searchParams = useSearchParams();
    const { selectedPropertyId, setSelectedPropertyId, properties, loading } = useProperty();
    const { t } = useLanguageContext();

    if (loading && properties.length === 0) {
        return (
            <div className="flex-1 min-h-0 h-full w-full overflow-hidden">
                <VisualPlannerSkeleton />
            </div>
        );
    }

    const paramPropertyId = searchParams.get('propertyId');
    const unconfiguredProperty = properties.find((p) => !p.isMapSetupComplete);
    const activePropertyId =
        selectedPropertyId && selectedPropertyId !== 'all'
            ? selectedPropertyId
            : paramPropertyId || unconfiguredProperty?.id || (properties.length === 1 ? properties[0]?.id : null);

    if (!activePropertyId) {
        return (
            <div className="flex flex-col flex-1 min-h-0">
                <MobileHeader
                    title={t('Unit Map')}
                    showBack={true}
                    backHref="/mobile/landlord/menu"
                />
                <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
                    {properties.length === 0 ? (
                        <div className="rounded-3xl bg-card border border-border/60 p-6 text-center space-y-4 shadow-sm">
                            <div className="mx-auto size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                <Map className="size-6" />
                            </div>
                            <div className="space-y-1.5">
                                <h2 className="text-base font-bold text-foreground">
                                    {t('No Properties Yet')}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {t('Add a property first before setting up your interactive 2D unit map.')}
                                </p>
                            </div>
                            <Link
                                href="/mobile/landlord/properties"
                                className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold active:scale-95 transition-transform"
                            >
                                {t('Go to My Properties')}
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-1 px-1">
                                <h2 className="text-base font-bold text-foreground">
                                    {t('Select a Property')}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {t('Choose which property unit map you want to view or edit.')}
                                </p>
                            </div>
                            <div className="space-y-2.5">
                                {properties.map((property) => (
                                    <button
                                        key={property.id}
                                        type="button"
                                        onClick={() => setSelectedPropertyId(property.id)}
                                        className="w-full min-h-[60px] flex items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border/60 shadow-xs text-left active:scale-[0.99] transition-transform"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                <Building2 className="size-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-foreground truncate">
                                                    {property.name}
                                                </p>
                                                {property.address && (
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {property.address}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight className="size-5 text-muted-foreground shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-0 h-full w-full overflow-hidden">
            <VisualBuilder
                key={activePropertyId}
                propertyId={activePropertyId}
                mobileEmbedded
                showBackButton={true}
            />
        </div>
    );
}

export default function MobileLandlordUnitMapPage() {
    return (
        <Suspense
            fallback={
                <div className="flex-1 min-h-0 h-full w-full overflow-hidden">
                    <VisualPlannerSkeleton />
                </div>
            }
        >
            <MobileUnitMapContent />
        </Suspense>
    );
}
