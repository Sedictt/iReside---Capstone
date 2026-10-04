/**
 * Utility for triggering subtle haptic feedback on mobile devices.
 * Safely checks for window and navigator.vibrate availability.
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  success: [15, 50, 20],
  warning: [30, 60, 30],
  error: [40, 80, 40, 80],
};

export function triggerHaptic(type: HapticType = 'light'): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  if (!('vibrate' in navigator) || typeof navigator.vibrate !== 'function') {
    return false;
  }

  try {
    return navigator.vibrate(HAPTIC_PATTERNS[type]);
  } catch {
    return false;
  }
}
