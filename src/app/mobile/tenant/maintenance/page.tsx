import { MobileHeader } from '@/components/mobile/layout/MobileHeader'
import { TenantMaintenanceView } from '@/components/mobile/tenant/TenantMaintenanceView'

export const metadata = {
    title: 'Maintenance | iReside',
    description: 'Submit and track maintenance requests',
}

export default function TenantMaintenancePage() {
    return (
        <>
            <MobileHeader title="Maintenance" />
            <TenantMaintenanceView />
        </>
    )
}
