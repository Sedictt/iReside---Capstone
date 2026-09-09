import { MobileHeader } from '@/components/mobile/layout/MobileHeader'

export const metadata = {
    title: 'Overview | iReside',
    description: 'Property portfolio snapshot',
}

export default function LandlordOverviewPage() {
    return (
        <>
            <MobileHeader title="Overview" />
            <div className="px-4 py-5">
                <p className="text-muted-foreground text-sm">Overview screen — coming soon in next phase.</p>
            </div>
        </>
    )
}
