import { MobileHeader } from '@/components/mobile/layout/MobileHeader'
import { TenantProfileView } from '@/components/mobile/tenant/TenantProfileView'

export const metadata = {
    title: 'Profile | iReside',
    description: 'Manage your tenant profile and rental settings',
}

export default function TenantProfilePage() {
    return (
        <>
            <MobileHeader title="Profile" />
            <TenantProfileView />
        </>
    )
}
