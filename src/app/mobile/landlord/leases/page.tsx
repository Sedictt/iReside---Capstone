'use client';

import { Suspense } from 'react';
import { MobileHeader } from '@/components/mobile/layout/MobileHeader';
import { LandlordLeasesView } from '@/components/mobile/landlord/LandlordLeasesView';

export default function MobileLandlordLeasesPage() {
    return (
        <div className="flex flex-col min-h-full">
            <MobileHeader 
                title="Leases & Contracts" 
                showBack={true}
                backHref="/mobile/landlord/overview"
            />
            <div className="flex-1 min-h-0">
                <Suspense fallback={null}>
                    <LandlordLeasesView />
                </Suspense>
            </div>
        </div>
    );
}
