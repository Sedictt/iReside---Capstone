import { MobileHeader } from '@/components/mobile/layout/MobileHeader'
import { LandlordMessagesView } from '@/components/mobile/landlord/LandlordMessagesView'

export const metadata = {
    title: 'Messaging | iReside',
    description: 'Chat with tenants and broadcast announcements',
}

export default function LandlordMessagesPage() {
    return (
        <>
            <MobileHeader title="Messaging" />
            <LandlordMessagesView />
        </>
    )
}
