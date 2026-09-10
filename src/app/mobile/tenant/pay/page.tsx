import { MobileHeader } from '@/components/mobile/layout/MobileHeader'
import { TenantPayView } from '@/components/mobile/tenant/TenantPayView'

export const metadata = {
    title: 'Pay Rent | iReside',
    description: 'Pay your rent and view payment history',
}

export default function TenantPayPage() {
    return (
        <>
            <MobileHeader title="Payments" />
            <TenantPayView />
        </>
    )
}
