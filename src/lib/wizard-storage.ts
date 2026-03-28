const WIZARD_STATE_KEY = "iReside_wizard_state";
const STATE_VERSION = 1;
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface WizardState {
  version: number;
  timestamp: number;
  data: Record<string, unknown>;
}

/**
 * Save wizard state to localStorage with TTL
 * 
 * @param state - The wizard state data to save
 * @throws Error if localStorage is unavailable or quota exceeded
 */
export function saveWizardState(data: Record<string, unknown>): void {
  try {
    const state: WizardState = {
      version: STATE_VERSION,
      timestamp: Date.now(),
      data,
    };
    
    const serialized = JSON.stringify(state);
    localStorage.setItem(WIZARD_STATE_KEY, serialized);
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      throw new Error("Local storage quota exceeded. Please clear your browser data or try again.");
    }
    throw new Error("Failed to save wizard state: localStorage may be unavailable.");
  }
}

/**
 * Load wizard state from localStorage
 * Returns null if state is expired, invalid version, or not found
 * 
 * @returns The wizard state data, or null if unavailable/stale
 */
export function loadWizardState(): Record<string, unknown> | null {
  try {
    const serialized = localStorage.getItem(WIZARD_STATE_KEY);
    if (!serialized) {
      return null;
    }

    const state: WizardState = JSON.parse(serialized);
    
    // Check version compatibility
    if (state.version !== STATE_VERSION) {
      // Version mismatch - discard old state
      clearWizardState();
      return null;
    }
    
    // Check TTL
    const age = Date.now() - state.timestamp;
    if (age > TTL_MS) {
      // State expired - discard it
      clearWizardState();
      return null;
    }
    
    return state.data;
  } catch (error) {
    // Invalid JSON or other error - clear and return null
    clearWizardState();
    return null;
  }
}

/**
 * Clear wizard state from localStorage
 */
export function clearWizardState(): void {
  try {
    localStorage.removeItem(WIZARD_STATE_KEY);
  } catch (error) {
    // Silently fail - localStorage may be unavailable
    console.warn("Failed to clear wizard state:", error);
  }
}

/**
 * Check if localStorage is available
 * 
 * @returns true if localStorage is available, false otherwise
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "__localStorage_test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get the age of the stored wizard state in milliseconds
 * Returns null if no state exists
 * 
 * @returns Age in milliseconds, or null if no state
 */
export function getWizardStateAge(): number | null {
  try {
    const serialized = localStorage.getItem(WIZARD_STATE_KEY);
    if (!serialized) {
      return null;
    }

    const state: WizardState = JSON.parse(serialized);
    return Date.now() - state.timestamp;
  } catch (error) {
    return null;
  }
}

/**
 * Check if stored wizard state is expired
 * 
 * @returns true if state is expired or doesn't exist, false otherwise
 */
export function isWizardStateExpired(): boolean {
  const age = getWizardStateAge();
  if (age === null) {
    return true; // No state means "expired" for our purposes
  }
  return age > TTL_MS;
}
