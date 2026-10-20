"use client";

/**
 * iReside UI sounds.
 *
 * Every file in /public/sounds except pageturn.mp3 is synthesized in-house by
 * scripts/sounds/generate-sounds.py (no third-party samples); pageturn.mp3 is the
 * original page-turn recording, kept by choice. They share one key
 * (F major) and a soft mallet timbre, kept in the 300-1,500 Hz range so they stay
 * clear for older users without being shrill. Edit a recipe there and re-run it to
 * change a sound; the file names below stay the same.
 */
const SOUND_PATHS = {
    /** Something new arrived (bell / alerts). */
    notification: "/sounds/notification.mp3",
    /** Someone sent you a message. */
    message: "/sounds/message.mp3",
    /** Your own message went out (quiet; plays often). */
    message_sent: "/sounds/message_sent.mp3",
    /** An action finished. */
    success: "/sounds/success.mp3",
    /** Money received / receipt issued. */
    payment: "/sounds/payment.mp3",
    /** Please check something (not a failure). */
    warning: "/sounds/warning.mp3",
    /** Something did not work. */
    error: "/sounds/error.mp3",
    /** Small navigation tick (carousels, toggles). */
    tap: "/sounds/tap.mp3",
    /** E-book page turn. */
    pageturn: "/sounds/pageturn.mp3",
    // Unit map editor
    /** A room, corridor or structure is lifted. */
    map_pickup: "/sounds/map_pickup.mp3",
    /** The dragged item moves into a new grid cell (very quiet). */
    map_slide: "/sounds/map_slide.mp3",
    /** The dragged item locks onto a neighbour's edge. */
    map_snap: "/sounds/map_snap.mp3",
    /** Set down in a valid spot. */
    map_drop: "/sounds/map_drop.mp3",
    /** Dropped on top of something; it bounces back. */
    map_invalid: "/sounds/map_invalid.mp3",
    /** A new block is placed from the sidebar. */
    map_add: "/sounds/map_add.mp3",
    /** An item is deleted. */
    map_remove: "/sounds/map_remove.mp3",
    /** Undo. */
    map_undo: "/sounds/map_undo.mp3",
    /** Rotate or flip. */
    map_rotate: "/sounds/map_rotate.mp3",
} as const;

export type SoundType = keyof typeof SOUND_PATHS;

/** Volume each sound plays at unless the caller overrides it. */
const DEFAULT_VOLUME: Record<SoundType, number> = {
    notification: 0.6,
    message: 0.55,
    message_sent: 0.45,
    success: 0.5,
    payment: 0.6,
    warning: 0.5,
    error: 0.5,
    tap: 0.4,
    pageturn: 0.6,
    map_pickup: 0.7,
    map_slide: 0.6,
    map_snap: 0.7,
    map_drop: 0.75,
    map_invalid: 0.7,
    map_add: 0.7,
    map_remove: 0.7,
    map_undo: 0.65,
    map_rotate: 0.7,
};

/** Ignore repeats of the same sound inside this window (e.g. a burst of realtime events). */
const REPEAT_GUARD_MS = 120;
/** Per-sound overrides: drag ticks may repeat faster, but are still capped so a fast drag never buzzes. */
const REPEAT_GUARD_OVERRIDE: Partial<Record<SoundType, number>> = { map_slide: 55 };

class SoundManager {
    private static instance: SoundManager;
    private audioCache = new Map<SoundType, HTMLAudioElement>();
    private lastPlayed = new Map<SoundType, number>();

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) SoundManager.instance = new SoundManager();
        return SoundManager.instance;
    }

    public play(type: SoundType, volume?: number) {
        if (typeof window === "undefined") return;

        const now = Date.now();
        if (now - (this.lastPlayed.get(type) ?? 0) < (REPEAT_GUARD_OVERRIDE[type] ?? REPEAT_GUARD_MS)) return;
        this.lastPlayed.set(type, now);

        try {
            let audio = this.audioCache.get(type);
            if (!audio) {
                audio = new Audio(SOUND_PATHS[type]);
                audio.preload = "auto";
                this.audioCache.set(type, audio);
            }
            audio.volume = Math.min(1, Math.max(0, volume ?? DEFAULT_VOLUME[type]));
            audio.currentTime = 0;
            void audio.play().catch((err: unknown) => {
                // Browsers block audio until the user has interacted with the page; that is expected.
                if ((err as { name?: string })?.name !== "NotAllowedError") {
                    console.warn(`[sound] Could not play "${type}":`, err);
                }
            });
        } catch (err) {
            console.warn(`[sound] Could not play "${type}":`, err);
        }
    }
}

export const playSound = (type: SoundType, volume?: number) => {
    SoundManager.getInstance().play(type, volume);
};

/** Public path of a sound file, for code that needs its own audio pipeline (e.g. Web Audio). */
export const soundUrl = (type: SoundType) => SOUND_PATHS[type];

export function useSound() {
    return {
        playNotification: (volume?: number) => playSound("notification", volume),
        playMessage: (volume?: number) => playSound("message", volume),
        playSuccess: (volume?: number) => playSound("success", volume),
        playError: (volume?: number) => playSound("error", volume),
        playPayment: (volume?: number) => playSound("payment", volume),
        playWarning: (volume?: number) => playSound("warning", volume),
    };
}
