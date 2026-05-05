export type MoveOutStatus = "pending" | "approved" | "denied" | "completed";

const VALID_TRANSITIONS: Record<MoveOutStatus, MoveOutStatus[]> = {
  pending: ["approved", "denied"],
  approved: ["completed"],
  denied: [],
  completed: [],
};

export function isValidMoveOutStatusTransition(
  currentStatus: MoveOutStatus,
  newStatus: MoveOutStatus
): boolean {
  if (currentStatus === newStatus) return true;
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

export function getTransitionErrorMessage(
  currentStatus: MoveOutStatus,
  newStatus: MoveOutStatus
): string {
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed || allowed.length === 0) {
    return `Cannot transition move-out request from "${currentStatus}". This is a terminal state.`;
  }
  return `Cannot transition move-out request from "${currentStatus}" to "${newStatus}". Allowed transitions from "${currentStatus}" are: ${allowed.join(", ")}.`;
}

export const MOVE_OUT_STATUS_LABELS: Record<MoveOutStatus, string> = {
  pending: "Pending Review",
  approved: "Approved",
  denied: "Denied",
  completed: "Completed",
};

export const MOVE_OUT_STATUS_COLORS: Record<MoveOutStatus, string> = {
  pending: "yellow",
  approved: "blue",
  denied: "red",
  completed: "green",
};