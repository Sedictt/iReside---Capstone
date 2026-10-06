'use client';

import { Suspense } from 'react';
import { MobileHeader } from '@/components/mobile/layout/MobileHeader';
import { LandlordPropertiesView } from '@/components/mobile/landlord/LandlordPropertiesView';

export default function MobileLandlordPropertiesPage() {
    return (
        <div className="flex flex-col min-h-full">
            <MobileHeader 
                title="Properties & Units" 
                showBack={true}
                backHref="/mobile/landlord/overview"
            />
            <div className="flex-1 min-h-0">
                <Suspense fallback={null}>
                    <LandlordPropertiesView />
                </Suspense>
            </div>
        </div>
    );
}
