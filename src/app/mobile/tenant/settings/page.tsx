import { MobileHeader } from '@/components/mobile/layout/MobileHeader'
import { TenantMobileSettingsView } from '@/components/mobile/tenant/TenantMobileSettingsView'

export const metadata = {
    title: 'Settings | iReside',
    description: 'Configure your resident account, security, and preferences',
}

export default function TenantSettingsPage() {
    return (
        <>
            <MobileHeader title="Settings" showBack backHref="/mobile/tenant/profile" />
            <TenantMobileSettingsView />
        </>
    )
}
