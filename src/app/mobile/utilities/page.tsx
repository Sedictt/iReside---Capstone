'use client';

import { Suspense } from 'react';
import { MobileHeader } from '@/components/mobile/layout/MobileHeader';
import { MobileUtilitiesView } from '@/components/mobile/shared/MobileUtilitiesView';
import { useAuth } from '@/context/AuthContext';

export default function MobileUtilitiesPage() {
    const { profile } = useAuth();
    const role = profile?.role as 'tenant' | 'landlord' | undefined;
    const fallbackBack = role === 'landlord' ? '/mobile/landlord/overview' : '/mobile/tenant/home';

    return (
        <div className="flex flex-col min-h-full">
            <MobileHeader 
                title="Utility Submeters" 
                showBack={true}
                backHref={fallbackBack}
            />
            <div className="flex-1 min-h-0">
                <Suspense fallback={null}>
                    <MobileUtilitiesView />
                </Suspense>
            </div>
        </div>
    );
}
