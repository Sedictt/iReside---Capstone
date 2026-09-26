import { MobileHeader } from '@/components/mobile/layout/MobileHeader'
import { LandlordOverviewView } from '@/components/mobile/landlord/LandlordOverviewView'

export const metadata = {
    title: 'Dashboard | iReside',
    description: 'Property portfolio snapshot',
}

export default function LandlordOverviewPage() {
    return (
        <div className="flex-1 min-h-0 flex flex-col">
            <MobileHeader title="Dashboard" />
            <div className="flex-1 min-h-0 flex flex-col">
                <LandlordOverviewView />
            </div>
        </div>
    )
}
