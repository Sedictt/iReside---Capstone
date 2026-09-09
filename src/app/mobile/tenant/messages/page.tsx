import { MobileHeader } from '@/components/mobile/layout/MobileHeader'

export const metadata = {
    title: 'Messages | iReside',
    description: 'Chat with your landlord',
}

export default function TenantMessagesPage() {
    return (
        <>
            <MobileHeader title="Messages" />
            <div className="px-4 py-5">
                <p className="text-muted-foreground text-sm">Messages screen — coming soon in next phase.</p>
            </div>
        </>
    )
}
