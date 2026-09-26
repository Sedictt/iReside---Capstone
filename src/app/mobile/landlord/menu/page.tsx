import { MobileHeader } from '@/components/mobile/layout/MobileHeader'
import { LandlordMenuView } from '@/components/mobile/landlord/LandlordMenuView'

export const metadata = {
    title: 'Menu | iReside',
    description: 'Landlord navigation and portfolio hub',
}

export default function LandlordMenuPage() {
    return (
        <div className="flex-1 min-h-0 flex flex-col">
            <MobileHeader title="Menu" />
            <div className="flex-1 min-h-0 flex flex-col">
                <LandlordMenuView />
            </div>
        </div>
    )
}
