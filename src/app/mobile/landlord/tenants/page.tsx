'use client';

import { Suspense } from 'react';
import { MobileHeader } from '@/components/mobile/layout/MobileHeader';
import { LandlordTenantsView } from '@/components/mobile/landlord/LandlordTenantsView';

export default function MobileLandlordTenantsPage() {
    return (
        <div className="flex flex-col min-h-full">
            <MobileHeader 
                title="Tenant Directory" 
                showBack={true}
                backHref="/mobile/landlord/overview"
            />
            <div className="flex-1 min-h-0">
                <Suspense fallback={null}>
                    <LandlordTenantsView />
                </Suspense>
            </div>
        </div>
    );
}
