import { ApplicationError } from "../errors/application-error.js";

export function validateTargetUserId(currentUserId: string, targetUserId: unknown): string {
  if (typeof targetUserId !== "string" || !targetUserId.trim()) {
    throw new ApplicationError("VALIDATION_ERROR", "Target user ID must be a non-empty string");
  }

  const trimmed = targetUserId.trim();
  if (trimmed === currentUserId) {
    throw new ApplicationError("VALIDATION_ERROR", "Cannot perform social actions on yourself");
  }

  return trimmed;
}
