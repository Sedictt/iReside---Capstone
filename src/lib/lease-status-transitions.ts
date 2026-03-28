import type { LeaseStatus } from "@/types/database";

/**
 * Valid status transitions for lease state machine
 * Each status maps to the allowed next statuses
 */
const VALID_TRANSITIONS: Record<LeaseStatus, LeaseStatus[]> = {
  draft: ["pending_signature", "pending_tenant_signature"],
  pending_signature: ["pending_tenant_signature", "pending_landlord_signature"],
  pending_tenant_signature: ["pending_landlord_signature"],
  pending_landlord_signature: ["active"],
  active: ["expired", "terminated"],
  expired: [],
  terminated: [],
};

/**
 * Validate if a lease status transition is allowed
 * 
 * @param currentStatus - The current lease status
 * @param newStatus - The desired new status
 * @returns true if the transition is valid, false otherwise
 */
export function isValidLeaseStatusTransition(
  currentStatus: LeaseStatus,
  newStatus: LeaseStatus
): boolean {
  // Allow same status (no change)
  if (currentStatus === newStatus) {
    return true;
  }

  // Check if transition is in the allowed list
  const allowedTransitions = VALID_TRANSITIONS[currentStatus];
  return allowedTransitions.includes(newStatus);
}

/**
 * Get allowed next statuses for a given current status
 * 
 * @param currentStatus - The current lease status
 * @returns Array of allowed next statuses
 */
export function getAllowedTransitions(currentStatus: LeaseStatus): LeaseStatus[] {
  return [...VALID_TRANSITIONS[currentStatus]];
}

/**
 * Get human-readable error message for invalid transition
 * 
 * @param currentStatus - The current lease status
 * @param newStatus - The attempted new status
 * @returns Error message explaining why the transition is invalid
 */
export function getTransitionErrorMessage(
  currentStatus: LeaseStatus,
  newStatus: LeaseStatus
): string {
  const allowed = getAllowedTransitions(currentStatus);
  if (allowed.length === 0) {
    return `Cannot transition from "${currentStatus}" to any other status. This lease is in a terminal state.`;
  }
  
  return `Cannot transition lease from "${currentStatus}" to "${newStatus}". Allowed transitions from "${currentStatus}" are: ${allowed.map(s => `"${s}"`).join(", ")}.`;
}
