"use client";

const SOUND_PATHS = {
    notification: "/audios/notification.mp3",
    message: "/audios/message.mp3",
    success: "/audios/ui_success.mp3",
    error: "/audios/ui_error.mp3",
} as const;

type SoundType = keyof typeof SOUND_PATHS;

class SoundManager {
    private static instance: SoundManager;
    private audioCache: Map<string, HTMLAudioElement> = new Map();

    private constructor() {}

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    public play(type: SoundType, volume: number = 0.5) {
        if (typeof window === "undefined") return;

        console.log(`[SoundManager] Attempting to play: ${type}`);
        
        try {
            let audio = this.audioCache.get(type);
            if (!audio) {
                console.log(`[SoundManager] Creating new Audio for: ${SOUND_PATHS[type]}`);
                audio = new Audio(SOUND_PATHS[type]);
                this.audioCache.set(type, audio);
                
                // Add error listener
                audio.onerror = (e) => console.error(`[SoundManager] Error loading ${type}:`, e);
            }

            audio.volume = volume;
            audio.currentTime = 0;
            
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    if (err.name === "NotAllowedError") {
                        console.warn("[SoundManager] Playback blocked by browser policy. User interaction required.");
                    } else {
                        console.error("[SoundManager] Playback failed:", err);
                    }
                });
            }
        } catch (err) {
            console.error("[SoundManager] Unexpected error:", err);
        }
    }
}

export const playSound = (type: SoundType, volume?: number) => {
    SoundManager.getInstance().play(type, volume);
};

export function useSound() {
    return {
        playNotification: (volume?: number) => playSound("notification", volume),
        playMessage: (volume?: number) => playSound("message", volume),
        playSuccess: (volume?: number) => playSound("success", volume),
        playError: (volume?: number) => playSound("error", volume),
    };
}
