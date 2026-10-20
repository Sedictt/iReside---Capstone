import { notFound } from "next/navigation";
import { SoundBoard } from "./SoundBoard";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Sound Board",
    robots: { index: false, follow: false },
};

/** Audition the iReside UI sounds. Same gate as the defense console. */
export default function SoundBoardPage() {
    if (process.env.DEMO_CONSOLE_ENABLED !== "true") {
        notFound();
    }
    return <SoundBoard />;
}
