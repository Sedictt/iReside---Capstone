import { MobileHeader } from '@/components/mobile/layout/MobileHeader'

export const metadata = {
    title: 'Maintenance | iReside',
    description: 'Maintenance requests',
}

export default function TenantMaintenancePage() {
    return (
        <>
            <MobileHeader title="Maintenance" />
            <div className="px-4 py-5">
                <p className="text-muted-foreground text-sm">Maintenance screen — coming soon in next phase.</p>
            </div>
        </>
    )
}
