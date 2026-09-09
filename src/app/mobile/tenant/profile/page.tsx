import { MobileHeader } from '@/components/mobile/layout/MobileHeader'

export const metadata = {
    title: 'Profile | iReside',
    description: 'Your profile and settings',
}

export default function TenantProfilePage() {
    return (
        <>
            <MobileHeader title="Profile" />
            <div className="px-4 py-5">
                <p className="text-muted-foreground text-sm">Profile screen — coming soon in next phase.</p>
            </div>
        </>
    )
}
