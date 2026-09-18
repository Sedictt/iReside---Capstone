'use client'

import { LandlordSettings } from '@/components/landlord/LandlordSettings'

export function LandlordMobileSettingsView() {
    return (
        <div className="mobile-content-pad px-4 py-3">
            <LandlordSettings isMobile={true} />
        </div>
    )
}
