import { MobileHeader } from '@/components/mobile/layout/MobileHeader'
import { TenantHomeView } from '@/components/mobile/tenant/TenantHomeView'

export const metadata = {
    title: 'Home | iReside',
    description: 'Your rental dashboard overview',
}

export default function TenantHomePage() {
    return (
        <>
            <MobileHeader title="Home" />
            <TenantHomeView />
        </>
    )
}
