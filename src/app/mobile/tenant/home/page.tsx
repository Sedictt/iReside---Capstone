import { MobileHeader } from '@/components/mobile/layout/MobileHeader'

export const metadata = {
    title: 'Home | iReside',
    description: 'Your rental dashboard overview',
}

export default function TenantHomePage() {
    return (
        <>
            <MobileHeader title="Home" />
            <div className="px-4 py-5">
                <p className="text-muted-foreground text-sm">Dashboard coming in Phase 3.</p>
            </div>
        </>
    )
}
