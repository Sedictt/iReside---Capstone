'use client';

import { MobileHeader } from '@/components/mobile/layout/MobileHeader';
import { MobileNotificationsView } from '@/components/mobile/shared/MobileNotificationsView';
import { useAuth } from '@/context/AuthContext';

export default function MobileNotificationsPage() {
    const { profile } = useAuth();
    const role = profile?.role as 'tenant' | 'landlord' | undefined;
    const fallbackBackHref = role === 'landlord' ? '/mobile/landlord/overview' : '/mobile/tenant/home';

    return (
        <div className="flex flex-col flex-1 min-h-0 bg-background text-foreground">
            <MobileHeader
                title="Notifications"
                showBack={true}
                backHref={fallbackBackHref}
                rightAction={<div className="w-9 h-9" />}
            />
            <div className="flex-1 min-h-0 overflow-y-auto">
                <MobileNotificationsView />
            </div>
        </div>
    );
}
