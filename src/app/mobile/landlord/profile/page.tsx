import Link from 'next/link'
import { Settings } from 'lucide-react'
import { MobileHeader } from '@/components/mobile/layout/MobileHeader'
import { LandlordProfileView } from '@/components/mobile/landlord/LandlordProfileView'

export const metadata = {
    title: 'Profile | iReside',
    description: 'Your profile, settings, and business credentials',
}

export default function LandlordProfilePage() {
    return (
        <>
            <MobileHeader 
                title="Profile" 
                rightAction={
                    <Link
                        href="/mobile/landlord/settings"
                        className="flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        aria-label="Settings"
                    >
                        <Settings size={20} strokeWidth={1.8} />
                    </Link>
                }
            />
            <LandlordProfileView />
        </>
    )
}
