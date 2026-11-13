import { MobileHeader } from '@/components/mobile/layout/MobileHeader';
import { TenantMenuView } from '@/components/mobile/tenant/TenantMenuView';

export const metadata = {
    title: 'Menu | iReside',
    description: 'Tenant resident navigation and services hub',
};

export default function TenantMenuPage() {
    return (
        <div className="flex-1 min-h-0 flex flex-col">
            <MobileHeader title="Menu" />
            <div className="flex-1 min-h-0 flex flex-col">
                <TenantMenuView />
            </div>
        </div>
    );
}
