import { MobileHeader } from '@/components/mobile/layout/MobileHeader'
import { LandlordMobileSettingsView } from '@/components/mobile/landlord/LandlordMobileSettingsView'

export const metadata = {
    title: 'Settings | iReside',
    description: 'Configure your landlord account, identity, and preferences',
}

export default function LandlordSettingsPage() {
    return (
        <>
            <MobileHeader title="Settings" showBack backHref="/mobile/landlord/profile" />
            <LandlordMobileSettingsView />
        </>
    )
}
