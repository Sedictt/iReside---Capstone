import { MobileHeader } from '@/components/mobile/layout/MobileHeader'
import { LandlordProfileView } from '@/components/mobile/landlord/LandlordProfileView'

export const metadata = {
    title: 'Profile | iReside',
    description: 'Your profile, settings, and audit logs',
}

export default function LandlordProfilePage() {
    return (
        <>
            <MobileHeader title="Profile" />
            <LandlordProfileView />
        </>
    )
}
