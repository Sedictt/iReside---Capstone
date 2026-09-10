import { MobileHeader } from '@/components/mobile/layout/MobileHeader'
import { LandlordTicketsView } from '@/components/mobile/landlord/LandlordTicketsView'

export const metadata = {
    title: 'Tickets | iReside',
    description: 'Maintenance ticket management',
}

export default function LandlordTicketsPage() {
    return (
        <>
            <MobileHeader title="Tickets" />
            <LandlordTicketsView />
        </>
    )
}
