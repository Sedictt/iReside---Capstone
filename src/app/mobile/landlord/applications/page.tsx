'use client';

import { Suspense } from 'react';
import { MobileHeader } from '@/components/mobile/layout/MobileHeader';
import { LandlordApplicationsView } from '@/components/mobile/landlord/LandlordApplicationsView';

export default function MobileLandlordApplicationsPage() {
    return (
        <div className="flex flex-col min-h-full">
            <MobileHeader 
                title="Rental Applications" 
                showBack={true}
                backHref="/mobile/landlord/overview"
            />
            <div className="flex-1 min-h-0">
                <Suspense fallback={null}>
                    <LandlordApplicationsView />
                </Suspense>
            </div>
        </div>
    );
}
