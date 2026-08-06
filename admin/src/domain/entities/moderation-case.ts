import type {
  CreateModerationActionInput,
  ModerationActionType,
  ModerationCaseStatus,
  ReportSubjectType,
  SanctionType,
  UpdateModerationCaseInput,
} from "@platform/shared-types";

export interface ModerationCase {
  id: string;
  reportId: string | null;
  subjectType: ReportSubjectType;
  subjectId: string;
  status: ModerationCaseStatus;
  assignedModeratorId: string | null;
  priority: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationAction {
  id: string;
  caseId: string;
  actorUserId: string;
  actionType: ModerationActionType;
  reason: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface UserSanction {
  id: string;
  userId: string;
  sanctionType: SanctionType;
  reason: string;
  expiresAt: string | null;
  revokedAt: string | null;
  revokedByUserId: string | null;
  createdAt: string;
}

export interface ModerationCaseDetails {
  case: ModerationCase;
  actions: ModerationAction[];
}

export type {
  CreateModerationActionInput,
  ModerationActionType,
  ModerationCaseStatus,
  ReportSubjectType,
  SanctionType,
  UpdateModerationCaseInput,
};
