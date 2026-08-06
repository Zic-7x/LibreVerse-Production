import type { ModerationAction } from "../../domain/entities/moderation-case.js";

export class AuditTrailComponent {
  formatActionLog(actions: ModerationAction[]): Array<{
    id: string;
    actionType: string;
    actorUserId: string;
    reason: string;
    timestamp: string;
  }> {
    return actions.map((act) => ({
      id: act.id,
      actionType: act.actionType.toUpperCase(),
      actorUserId: act.actorUserId,
      reason: act.reason,
      timestamp: act.createdAt,
    }));
  }
}
