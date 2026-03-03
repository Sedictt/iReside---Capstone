"use client";

import { NavigationProvider } from "@/components/mobile/navigation";
import MobileAppShell from "@/components/mobile/MobileAppShell";

export default function MobilePage() {
    return (
        <NavigationProvider>
            <MobileAppShell />
        </NavigationProvider>
    );
}
