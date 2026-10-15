'use client';

import { Suspense } from 'react';
import { MobileHeader } from '@/components/mobile/layout/MobileHeader';
import { MobileCalendarView } from '@/components/mobile/shared/MobileCalendarView';
import { useLanguageContext } from '@/context/LanguageContext';

export default function TenantMobileCalendarPage() {
    const { t } = useLanguageContext();

    return (
        <div className="flex flex-col min-h-full">
            <MobileHeader 
                title={t('My Schedule')}
                showBack={true}
                backHref="/mobile/tenant/home"
            />
            <div className="flex-1 min-h-0">
                <Suspense fallback={null}>
                    <MobileCalendarView />
                </Suspense>
            </div>
        </div>
    );
}
