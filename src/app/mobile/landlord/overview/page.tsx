import { MobileHeader } from '@/components/mobile/layout/MobileHeader'
import { LandlordOverviewView } from '@/components/mobile/landlord/LandlordOverviewView'

export const metadata = {
    title: 'Overview | iReside',
    description: 'Property portfolio snapshot',
}

export default function LandlordOverviewPage() {
    return (
        <>
            <MobileHeader title="Overview" />
            <LandlordOverviewView />
        </>
    )
}
