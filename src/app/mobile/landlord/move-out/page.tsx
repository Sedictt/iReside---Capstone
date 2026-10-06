'use client';

import { Suspense } from 'react';
import { MobileHeader } from '@/components/mobile/layout/MobileHeader';
import { LandlordMoveOutView } from '@/components/mobile/landlord/LandlordMoveOutView';

export default function MobileLandlordMoveOutPage() {
    return (
        <div className="flex flex-col min-h-full">
            <MobileHeader 
                title="Move-Out & Inspection" 
                showBack={true}
                backHref="/mobile/landlord/overview"
            />
            <div className="flex-1 min-h-0">
                <Suspense fallback={null}>
                    <LandlordMoveOutView />
                </Suspense>
            </div>
        </div>
    );
}
