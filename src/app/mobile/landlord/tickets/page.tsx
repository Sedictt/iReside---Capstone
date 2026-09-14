import { MobileHeader } from '@/components/mobile/layout/MobileHeader'
import { LandlordTicketsView } from '@/components/mobile/landlord/LandlordTicketsView'

export const metadata = {
    title: 'Maintenance | iReside',
    description: 'Maintenance request management',
}

export default function LandlordTicketsPage() {
    return (
        <>
            <MobileHeader title="Maintenance" />
            <LandlordTicketsView />
        </>
    )
}
