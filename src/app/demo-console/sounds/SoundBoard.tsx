"use client";

import { useState } from "react";
import { playSound, type SoundType } from "@/hooks/useSound";

const SOUNDS: Array<{ type: SoundType; label: string; when: string }> = [
    { type: "notification", label: "Notification", when: "A new alert arrives (bell)." },
    { type: "message", label: "Message received", when: "Someone sends you a chat message." },
    { type: "message_sent", label: "Message sent", when: "Your own message goes out." },
    { type: "success", label: "Success", when: "An action finishes (success toasts)." },
    { type: "payment", label: "Payment", when: "Landlord confirms a payment or collects cash; tenant's payment is confirmed." },
    { type: "warning", label: "Warning", when: "Something needs checking (warning toasts)." },
    { type: "error", label: "Error", when: "Something did not work (error toasts)." },
    { type: "tap", label: "Tap", when: "Small navigation, e.g. the notification banner arrows." },
    { type: "pageturn", label: "Page turn", when: "Turning a page in the e-book manual (original recording)." },
    { type: "map_pickup", label: "Unit map · Pick up", when: "A room, corridor or stairwell starts moving." },
    { type: "map_slide", label: "Unit map · Slide", when: "The dragged item enters a new grid cell (very quiet)." },
    { type: "map_snap", label: "Unit map · Snap", when: "It locks onto a neighbour's edge." },
    { type: "map_drop", label: "Unit map · Drop", when: "It is set down in a valid spot." },
    { type: "map_invalid", label: "Unit map · Bounce back", when: "Dropped on top of something; it returns." },
    { type: "map_add", label: "Unit map · Add block", when: "A new room, corridor or structure is placed from the sidebar." },
    { type: "map_remove", label: "Unit map · Remove", when: "An item is deleted." },
    { type: "map_undo", label: "Unit map · Undo", when: "Undo the last change." },
    { type: "map_rotate", label: "Unit map · Rotate / flip", when: "Rotate or flip the selected item." },
];

export function SoundBoard() {
    const [last, setLast] = useState<SoundType | null>(null);

    return (
        <main style={{ minHeight: "100vh", background: "#0f1512", color: "#e8efe9", fontFamily: "ui-sans-serif, system-ui, Segoe UI, sans-serif", padding: "32px 20px" }}>
            <div style={{ maxWidth: 760, margin: "0 auto" }}>
                <div style={{ fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: "#7fd1b4", fontWeight: 700 }}>Private · Sound board</div>
                <h1 style={{ margin: "4px 0 6px", fontSize: 26, fontWeight: 800 }}>iReside sounds</h1>
                <p style={{ margin: "0 0 22px", color: "#9fb3a8", fontSize: 15 }}>
                    All sounds except the page turn are synthesized in-house (scripts/sounds/generate-sounds.py). Click to hear each one at the volume the app uses.
                </p>
                <div style={{ display: "grid", gap: 10 }}>
                    {SOUNDS.map((s) => (
                        <button
                            key={s.type}
                            type="button"
                            onClick={() => {
                                playSound(s.type);
                                setLast(s.type);
                            }}
                            style={{
                                display: "flex", alignItems: "center", gap: 14, textAlign: "left", width: "100%", cursor: "pointer",
                                border: `1px solid ${last === s.type ? "#4f8f7a" : "#27352e"}`, background: last === s.type ? "#1b2a21" : "#162019",
                                color: "#e8efe9", borderRadius: 14, padding: "14px 16px", fontSize: 16,
                            }}
                        >
                            <span aria-hidden style={{ fontSize: 22, width: 28, textAlign: "center" }}>▶</span>
                            <span style={{ flex: 1 }}>
                                <span style={{ display: "block", fontWeight: 700 }}>{s.label}</span>
                                <span style={{ display: "block", color: "#9fb3a8", fontSize: 14, marginTop: 2 }}>{s.when}</span>
                            </span>
                            <code style={{ color: "#7fd1b4", fontSize: 13 }}>{s.type}</code>
                        </button>
                    ))}
                </div>
            </div>
        </main>
    );
}
