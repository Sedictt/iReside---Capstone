import { MobileHeader } from '@/components/mobile/layout/MobileHeader'
import { LandlordAnalyticsView } from '@/components/mobile/landlord/LandlordAnalyticsView'

export const metadata = {
    title: 'Analytics | iReside',
    description: 'Portfolio analytics and performance metrics',
}

export default function LandlordAnalyticsPage() {
    return (
        <div className="flex-1 min-h-0 flex flex-col">
            <MobileHeader title="Analytics" showBack backHref="/mobile/landlord/menu" />
            <div className="flex-1 min-h-0 flex flex-col">
                <LandlordAnalyticsView />
            </div>
        </div>
    )
}
