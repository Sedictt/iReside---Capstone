'use client';

import { Suspense } from 'react';
import { MobileHeader } from '@/components/mobile/layout/MobileHeader';
import { MobileCalendarView } from '@/components/mobile/shared/MobileCalendarView';
import { useAuth } from '@/context/AuthContext';

export default function MobileCalendarPage() {
    const { profile } = useAuth();
    const role = profile?.role as 'tenant' | 'landlord' | undefined;
    const fallbackBack = role === 'landlord' ? '/mobile/landlord/overview' : '/mobile/tenant/home';

    return (
        <div className="flex flex-col min-h-full">
            <MobileHeader 
                title="Operations Schedule" 
                showBack={true}
                backHref={fallbackBack}
            />
            <div className="flex-1 min-h-0">
                <Suspense fallback={null}>
                    <MobileCalendarView />
                </Suspense>
            </div>
        </div>
    );
}
