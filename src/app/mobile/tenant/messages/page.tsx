import { MobileHeader } from '@/components/mobile/layout/MobileHeader'
import { TenantMessagesView } from '@/components/mobile/tenant/TenantMessagesView'

export const metadata = {
    title: 'Messages | iReside',
    description: 'Chat with your landlord and view building notices',
}

export default function TenantMessagesPage() {
    return (
        <>
            <MobileHeader title="Messages" />
            <TenantMessagesView />
        </>
    )
}
