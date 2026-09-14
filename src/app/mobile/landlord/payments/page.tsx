import { MobileHeader } from '@/components/mobile/layout/MobileHeader'
import { LandlordPaymentsView } from '@/components/mobile/landlord/LandlordPaymentsView'

export const metadata = {
    title: 'Payments | iReside',
    description: 'Review tenant payment proofs',
}

export default function LandlordPaymentsPage() {
    return (
        <>
            <MobileHeader title="Payments" />
            <LandlordPaymentsView />
        </>
    )
}
