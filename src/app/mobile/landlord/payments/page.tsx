import { MobileHeader } from '@/components/mobile/layout/MobileHeader'

export const metadata = {
    title: 'Payments | iReside',
    description: 'Review tenant payment proofs',
}

export default function LandlordPaymentsPage() {
    return (
        <>
            <MobileHeader title="Payments" />
            <div className="px-4 py-5">
                <p className="text-muted-foreground text-sm">Payments screen — coming soon in next phase.</p>
            </div>
        </>
    )
}
