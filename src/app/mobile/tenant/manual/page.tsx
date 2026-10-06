'use client';

import { MobileHeader } from '@/components/mobile/layout/MobileHeader';
import { TenantManualView } from '@/components/mobile/tenant/TenantManualView';

export default function MobileTenantManualPage() {
    return (
        <div className="flex flex-col min-h-full">
            <MobileHeader 
                title="House Rules & Safety" 
                showBack={true}
                backHref="/mobile/tenant/home"
            />
            <div className="flex-1">
                <TenantManualView />
            </div>
        </div>
    );
}
