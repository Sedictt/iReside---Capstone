'use client'

import { TenantSettings } from '@/components/tenant/TenantSettings'

export function TenantMobileSettingsView() {
    return (
        <div className="mobile-content-pad px-4 py-3">
            <TenantSettings isMobile={true} />
        </div>
    )
}
