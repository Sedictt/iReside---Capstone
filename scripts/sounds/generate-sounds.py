"""
iReside sound set generator.

Synthesizes every UI sound from scratch (no samples, no downloads), so the set is
original and license-free. Re-run after tweaking a recipe:

    python scripts/sounds/generate-sounds.py

Output: public/sounds/<name>.mp3 (+ a .wav master in scripts/sounds/out/, git-ignored).

Design notes
- One musical identity: everything sits in F major (F A C, with G and D as passing
  tones), so sounds never clash when two play close together.
- Timbre: a soft mallet ("marimba / felt bell") made of a fundamental, a quiet
  octave, and a short 4th-harmonic strike that gives the attack without harshness.
- Pitch range ~300-1,500 Hz: clearly audible for older listeners, whose hearing
  drops off first in the high frequencies; nothing shrill or buzzy.
- Each event has its own shape so it is recognisable without looking:
    notification   two rising notes          "something new for you"
    message        quick bright double pluck "a person wrote to you"
    message_sent   one short soft pluck      "sent" (quiet, frequent)
    success        three-note rising chord   "done"
    payment        rising chime + shimmer    "money received / receipt issued"
    warning        two equal mid notes       "please check this"
    error          two falling low notes     "that didn't work" (calm, not a buzzer)
    tap            tiny wooden tick          navigation / toggles
    pageturn       paper swish               e-book page turn
"""

from __future__ import annotations

import os
import subprocess
import wave

import numpy as np

SR = 48_000
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_PUBLIC = os.path.join(ROOT, "public", "sounds")
OUT_MASTER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")

# F major pitches (Hz)
F3, A3, C4, D4 = 174.61, 220.00, 261.63, 293.66
F4, G4, A4, C5, D5 = 349.23, 392.00, 440.00, 523.25, 587.33
F5, G5, A5, C6 = 698.46, 783.99, 880.00, 1046.50

rng = np.random.default_rng(20261018)  # deterministic: same files every run


def t_axis(seconds: float) -> np.ndarray:
    return np.arange(int(SR * seconds)) / SR


def envelope(n: int, attack: float, decay: float) -> np.ndarray:
    """Fast linear attack, exponential decay (time constant `decay` seconds)."""
    t = np.arange(n) / SR
    env = np.exp(-np.maximum(t - attack, 0) / decay)
    a = int(SR * attack)
    if a > 0:
        env[:a] *= np.linspace(0, 1, a)
    return env


def mallet(freq: float, seconds: float = 0.9, decay: float = 0.28, brightness: float = 1.0) -> np.ndarray:
    """Soft mallet note: fundamental + quiet octave + short 4th-harmonic strike."""
    t = t_axis(seconds)
    n = len(t)
    body = np.sin(2 * np.pi * freq * t) * envelope(n, 0.004, decay)
    octave = 0.18 * brightness * np.sin(2 * np.pi * 2 * freq * t) * envelope(n, 0.003, decay * 0.55)
    strike = 0.22 * brightness * np.sin(2 * np.pi * 4 * freq * t) * envelope(n, 0.002, 0.035)
    # A touch of detuned chorus for warmth
    warm = 0.12 * np.sin(2 * np.pi * freq * 1.003 * t + 0.7) * envelope(n, 0.006, decay)
    return body + octave + strike + warm


def bell(freq: float, seconds: float = 1.4, decay: float = 0.55) -> np.ndarray:
    """Gentle bell for the payment chime (inharmonic partials, long tail)."""
    t = t_axis(seconds)
    n = len(t)
    partials = [(1.0, 1.0, 1.0), (2.0, 0.35, 0.6), (2.76, 0.18, 0.4), (5.4, 0.06, 0.15)]
    out = np.zeros(n)
    for ratio, amp, d in partials:
        out += amp * np.sin(2 * np.pi * freq * ratio * t) * envelope(n, 0.003, decay * d)
    return out


def place(track: np.ndarray, clip: np.ndarray, at: float, gain: float = 1.0) -> None:
    i = int(SR * at)
    end = min(len(track), i + len(clip))
    track[i:end] += gain * clip[: end - i]


def lowpass(x: np.ndarray, cutoff: float) -> np.ndarray:
    """One-pole low-pass, run twice (gentle 12 dB/oct) to round off any edge."""
    a = np.exp(-2 * np.pi * cutoff / SR)
    for _ in range(2):
        y = np.empty_like(x)
        acc = 0.0
        for i, v in enumerate(x):
            acc = (1 - a) * v + a * acc
            y[i] = acc
        x = y
    return x


def room(x: np.ndarray, mix: float = 0.12, length: float = 0.35) -> np.ndarray:
    """Tiny, soft room ambience: convolution with decaying filtered noise."""
    n = int(SR * length)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / (SR * length / 5))
    ir = lowpass(ir, 3500)
    ir /= np.sqrt(np.sum(ir**2)) + 1e-9
    wet = np.convolve(x, ir)  # length len(x) + n - 1
    dry = np.concatenate([x, np.zeros(n - 1)])
    return dry + mix * wet


def finish(x: np.ndarray, peak_db: float = -3.0, fade: float = 0.03) -> np.ndarray:
    """Trim trailing silence, fade out, normalise to a common peak."""
    thresh = np.max(np.abs(x)) * 10 ** (-60 / 20)
    idx = np.where(np.abs(x) > thresh)[0]
    x = x[: (idx[-1] + 1) if len(idx) else len(x)]
    f = int(SR * fade)
    if f and len(x) > f:
        x[-f:] *= np.linspace(1, 0, f)
    x = x / (np.max(np.abs(x)) + 1e-12) * 10 ** (peak_db / 20)
    return x


# ---------------------------------------------------------------------------
# Recipes
# ---------------------------------------------------------------------------

def notification() -> np.ndarray:
    tr = np.zeros(int(SR * 1.3))
    place(tr, mallet(C5, decay=0.30), 0.00, 0.85)
    place(tr, mallet(F5, decay=0.42), 0.13, 1.00)
    place(tr, mallet(F4, decay=0.50, brightness=0.4), 0.13, 0.25)  # soft low support
    return finish(room(lowpass(tr, 5200)), -3.0)


def message() -> np.ndarray:
    tr = np.zeros(int(SR * 0.8))
    place(tr, mallet(A5, decay=0.11, brightness=1.2), 0.00, 0.75)
    place(tr, mallet(C6, decay=0.16, brightness=1.0), 0.075, 0.85)
    return finish(room(lowpass(tr, 6500), mix=0.08), -4.0)


def message_sent() -> np.ndarray:
    tr = np.zeros(int(SR * 0.45))
    place(tr, mallet(G5, seconds=0.4, decay=0.07, brightness=0.7), 0.0, 1.0)
    return finish(room(lowpass(tr, 5000), mix=0.05, length=0.2), -9.0)


def success() -> np.ndarray:
    tr = np.zeros(int(SR * 1.5))
    place(tr, mallet(F4, decay=0.30), 0.00, 0.80)
    place(tr, mallet(A4, decay=0.32), 0.09, 0.85)
    place(tr, mallet(C5, decay=0.55), 0.18, 1.00)
    place(tr, mallet(F5, decay=0.55, brightness=0.5), 0.18, 0.30)
    return finish(room(lowpass(tr, 5500)), -3.0)


def payment() -> np.ndarray:
    tr = np.zeros(int(SR * 2.0))
    place(tr, mallet(C5, decay=0.22), 0.00, 0.70)
    place(tr, mallet(F5, decay=0.28), 0.08, 0.80)
    place(tr, bell(A5, decay=0.7), 0.17, 0.75)
    place(tr, bell(C6, decay=0.6), 0.17, 0.30)
    # light shimmer: a few quiet high grains like coins settling
    for k, at in enumerate([0.24, 0.31, 0.37, 0.45]):
        place(tr, bell(F5 * 2 * (1 + 0.01 * k), seconds=0.4, decay=0.12), at, 0.07)
    return finish(room(lowpass(tr, 7000), mix=0.15, length=0.5), -3.0)


def warning() -> np.ndarray:
    tr = np.zeros(int(SR * 1.0))
    place(tr, mallet(D5, decay=0.16, brightness=0.8), 0.00, 1.0)
    place(tr, mallet(D5, decay=0.24, brightness=0.8), 0.17, 0.9)
    place(tr, mallet(D4, decay=0.25, brightness=0.3), 0.00, 0.3)
    return finish(room(lowpass(tr, 4800)), -4.0)


def error() -> np.ndarray:
    tr = np.zeros(int(SR * 1.1))
    place(tr, mallet(A4, decay=0.20, brightness=0.7), 0.00, 1.0)
    place(tr, mallet(F4, decay=0.34, brightness=0.6), 0.16, 1.0)
    place(tr, mallet(F3, decay=0.34, brightness=0.3), 0.16, 0.45)  # weight, not harshness
    return finish(room(lowpass(tr, 3800)), -3.5)


def tap() -> np.ndarray:
    t = t_axis(0.09)
    n = len(t)
    click = np.sin(2 * np.pi * 1350 * t) * envelope(n, 0.0008, 0.012)
    knock = 0.6 * np.sin(2 * np.pi * 620 * t) * envelope(n, 0.001, 0.02)
    return finish(lowpass(click + knock, 6000), -12.0, fade=0.01)


def pageturn() -> np.ndarray:
    seconds = 0.42
    n = int(SR * seconds)
    noise = rng.standard_normal(n)
    t = np.arange(n) / SR
    # swish: noise swept from dull to airy and back, with a soft hump envelope
    shape = np.sin(np.pi * np.clip(t / seconds, 0, 1)) ** 1.6
    dull = lowpass(noise, 900)
    airy = lowpass(noise, 4200) - lowpass(noise, 1200)
    sweep = np.clip(t / (seconds * 0.6), 0, 1)
    swish = (1 - sweep) * dull + sweep * airy
    # paper flutter: a few tiny amplitude ripples
    flutter = 1 + 0.25 * np.sin(2 * np.pi * 23 * t) * np.exp(-t * 6)
    return finish(swish * shape * flutter, -10.0, fade=0.05)


RECIPES = {
    "notification": notification,
    "message": message,
    "message_sent": message_sent,
    "success": success,
    "payment": payment,
    "warning": warning,
    "error": error,
    "tap": tap,
    "pageturn": pageturn,
}


def write_wav(path: str, x: np.ndarray) -> None:
    data = (np.clip(x, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def ffmpeg_exe() -> str:
    try:
        import imageio_ffmpeg  # type: ignore

        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"


def main() -> None:
    os.makedirs(OUT_PUBLIC, exist_ok=True)
    os.makedirs(OUT_MASTER, exist_ok=True)
    ff = ffmpeg_exe()
    for name, recipe in RECIPES.items():
        x = recipe()
        wav = os.path.join(OUT_MASTER, f"{name}.wav")
        mp3 = os.path.join(OUT_PUBLIC, f"{name}.mp3")
        write_wav(wav, x)
        subprocess.run(
            [ff, "-y", "-loglevel", "error", "-i", wav, "-ac", "1", "-ar", "44100", "-b:a", "96k", mp3],
            check=True,
        )
        print(f"{name:13s} {len(x) / SR:5.2f}s  {os.path.getsize(mp3) / 1024:5.1f} KB")


if __name__ == "__main__":
    main()
