"use client";

/**
 * iReside UI sounds.
 *
 * Every file in /public/sounds is synthesized in-house by
 * scripts/sounds/generate-sounds.py (no third-party samples). They share one key
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
};

/** Ignore repeats of the same sound inside this window (e.g. a burst of realtime events). */
const REPEAT_GUARD_MS = 120;

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
        if (now - (this.lastPlayed.get(type) ?? 0) < REPEAT_GUARD_MS) return;
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
