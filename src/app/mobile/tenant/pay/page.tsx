import { MobileHeader } from '@/components/mobile/layout/MobileHeader'

export const metadata = {
    title: 'Pay | iReside',
    description: 'Payment history and proof submission',
}

export default function TenantPayPage() {
    return (
        <>
            <MobileHeader title="Pay" />
            <div className="px-4 py-5">
                <p className="text-muted-foreground text-sm">Pay screen — coming soon in next phase.</p>
            </div>
        </>
    )
}
