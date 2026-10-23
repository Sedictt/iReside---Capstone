import { notFound } from "next/navigation";
import { DemoConsole } from "./DemoConsole";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, DEMO_SCENARIOS } from "./scenarios";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Defense Console",
    robots: { index: false, follow: false },
};

/**
 * Private presenter console for the capstone defense.
 *
 * Only exists when DEMO_CONSOLE_ENABLED=true (see .env). The demo credentials are
 * passed to the client only in that case, so they never ship in a normal build.
 */
export default function DemoConsolePage() {
    if (process.env.DEMO_CONSOLE_ENABLED !== "true") {
        notFound();
    }
    const resetAvailable = process.env.NODE_ENV !== "production";
    return (
        <DemoConsole
            accounts={DEMO_ACCOUNTS}
            password={DEMO_PASSWORD}
            scenarios={DEMO_SCENARIOS}
            resetAvailable={resetAvailable}
        />
    );
}
