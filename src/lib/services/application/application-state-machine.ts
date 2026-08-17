/**
 * Application state machine definitions and transition guards.
 */
import type { ApplicationStatus } from "@/types/database";
import { InvalidApplicationStateError } from "./application.errors";

export const ALLOWED_APPLICATION_TRANSITIONS: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  pending: ["reviewing", "approved", "payment_pending", "rejected", "withdrawn"],
  reviewing: ["approved", "payment_pending", "rejected", "withdrawn", "pending"],
  payment_pending: ["approved", "rejected", "withdrawn"],
  approved: ["rejected", "withdrawn"],
  rejected: [],
  withdrawn: [],
};

const TERMINAL_APPLICATION_STATUSES = new Set<ApplicationStatus>(["rejected", "withdrawn"]);

/**
 * Check if a transition between two application statuses is allowed.
 *
 * @param from - Current application status.
 * @param to - Target application status.
 * @returns boolean indicating if the transition is permissible.
 */
export function canTransitionApplication(from: ApplicationStatus, to: ApplicationStatus): boolean {
  if (from === to) return true;
  const allowed = ALLOWED_APPLICATION_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

/**
 * Validates that a transition between two application statuses is legal.
 * Throws InvalidApplicationStateError if not permitted.
 *
 * @param from - Current application status.
 * @param to - Target application status.
 */
export function validateApplicationTransition(from: ApplicationStatus, to: ApplicationStatus): void {
  if (!canTransitionApplication(from, to)) {
    throw new InvalidApplicationStateError(from, to);
  }
}

/**
 * Checks whether an application is in a terminal status.
 *
 * @param status - Application status to check.
 * @returns boolean indicating if status is terminal.
 */
export function isTerminalApplicationStatus(status: ApplicationStatus): boolean {
  return TERMINAL_APPLICATION_STATUSES.has(status);
}
