"use client";

import { NavigationProvider } from "@/components/mobile/navigation";
import { NotificationProvider } from "@/components/mobile/NotificationContext";
import MobileAppShell from "@/components/mobile/MobileAppShell";

export default function MobilePage() {
    return (
        <NavigationProvider>
            <NotificationProvider>
                <MobileAppShell />
            </NotificationProvider>
        </NavigationProvider>
    );
}
