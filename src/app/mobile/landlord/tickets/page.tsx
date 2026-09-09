import { MobileHeader } from '@/components/mobile/layout/MobileHeader'

export const metadata = {
    title: 'Tickets | iReside',
    description: 'Maintenance ticket management',
}

export default function LandlordTicketsPage() {
    return (
        <>
            <MobileHeader title="Tickets" />
            <div className="px-4 py-5">
                <p className="text-muted-foreground text-sm">Tickets screen — coming soon in next phase.</p>
            </div>
        </>
    )
}
