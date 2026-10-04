import Link from 'next/link'
import { Settings } from 'lucide-react'
import { MobileHeader } from '@/components/mobile/layout/MobileHeader'
import { TenantProfileView } from '@/components/mobile/tenant/TenantProfileView'

export const metadata = {
    title: 'Profile | iReside',
    description: 'Manage your tenant profile and rental settings',
}

export default function TenantProfilePage() {
    return (
        <>
            <MobileHeader 
                title="Profile" 
                rightAction={
                    <Link
                        href="/mobile/tenant/settings"
                        className="flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        aria-label="Settings"
                    >
                        <Settings size={20} strokeWidth={1.8} />
                    </Link>
                }
            />
            <TenantProfileView />
        </>
    )
}
