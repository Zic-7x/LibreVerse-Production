import type {
  ModerationAction as SharedModerationAction,
  ModerationActionType,
  ModerationCase as SharedModerationCase,
  ModerationCaseStatus,
  ReportSubjectType,
  SanctionType,
  UserSanction as SharedUserSanction,
} from "@platform/shared-types";

export interface ModerationCaseEntity {
  id: string;
  reportId: string | null;
  subjectType: ReportSubjectType;
  subjectId: string;
  status: ModerationCaseStatus;
  assignedTo: string | null;
  priority: number;
  openedAt: Date;
  resolvedAt: Date | null;
  notes: string | null;
}

export interface ModerationActionEntity {
  id: string;
  caseId: string;
  moderatorUserId: string;
  actionType: ModerationActionType;
  reason: string | null;
  metadata: Record<string, unknown>;
  effectiveUntil: Date | null;
  createdAt: Date;
}

export interface UserSanctionEntity {
  id: string;
  userId: string;
  sanctionType: SanctionType;
  sourceActionId: string;
  startsAt: Date;
  endsAt: Date | null;
  revokedAt: Date | null;
}

export function toSharedModerationCase(entity: ModerationCaseEntity): SharedModerationCase {
  return {
    id: entity.id,
    reportId: entity.reportId,
    subjectType: entity.subjectType,
    subjectId: entity.subjectId,
    status: entity.status,
    assignedTo: entity.assignedTo,
    priority: entity.priority,
    openedAt: entity.openedAt.toISOString(),
    resolvedAt: entity.resolvedAt ? entity.resolvedAt.toISOString() : null,
    notes: entity.notes,
  };
}

export function toSharedModerationAction(entity: ModerationActionEntity): SharedModerationAction {
  return {
    id: entity.id,
    caseId: entity.caseId,
    moderatorUserId: entity.moderatorUserId,
    actionType: entity.actionType,
    reason: entity.reason,
    metadata: entity.metadata,
    effectiveUntil: entity.effectiveUntil ? entity.effectiveUntil.toISOString() : null,
    createdAt: entity.createdAt.toISOString(),
  };
}

export function toSharedUserSanction(entity: UserSanctionEntity): SharedUserSanction {
  return {
    id: entity.id,
    userId: entity.userId,
    sanctionType: entity.sanctionType,
    sourceActionId: entity.sourceActionId,
    startsAt: entity.startsAt.toISOString(),
    endsAt: entity.endsAt ? entity.endsAt.toISOString() : null,
    revokedAt: entity.revokedAt ? entity.revokedAt.toISOString() : null,
  };
}
