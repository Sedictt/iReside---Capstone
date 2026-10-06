'use client';

import { MobileHeader } from '@/components/mobile/layout/MobileHeader';
import { TenantLeaseView } from '@/components/mobile/tenant/TenantLeaseView';

export default function MobileTenantLeasePage() {
    return (
        <div className="flex flex-col min-h-full">
            <MobileHeader 
                title="Lease Agreement" 
                showBack={true}
                backHref="/mobile/tenant/home"
            />
            <div className="flex-1">
                <TenantLeaseView />
            </div>
        </div>
    );
}
