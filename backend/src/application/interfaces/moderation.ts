import type {
  ModerationActionType,
  ModerationCaseStatus,
  ReportSubjectType,
  SanctionType,
} from "@platform/shared-types";
import type {
  ModerationActionEntity,
  ModerationCaseEntity,
  UserSanctionEntity,
} from "../../domain/entities/moderation-entities.js";

export interface CreateCaseParams {
  reportId?: string | null;
  subjectType: ReportSubjectType;
  subjectId: string;
  assignedTo?: string | null;
  priority?: number;
  notes?: string | null;
}

export interface ListCasesFilter {
  status?: ModerationCaseStatus;
  subjectType?: ReportSubjectType;
  assignedTo?: string;
}

export interface CreateActionParams {
  caseId: string;
  moderatorUserId: string;
  actionType: ModerationActionType;
  reason?: string | null;
  metadata?: Record<string, unknown>;
  effectiveUntil?: Date | null;
}

export interface CreateSanctionParams {
  userId: string;
  sanctionType: SanctionType;
  sourceActionId: string;
  startsAt?: Date;
  endsAt?: Date | null;
}

export interface ModerationRepository {
  createCase(params: CreateCaseParams): Promise<ModerationCaseEntity>;
  findCaseById(id: string): Promise<ModerationCaseEntity | null>;
  listCases(filter?: ListCasesFilter): Promise<ModerationCaseEntity[]>;
  updateCase(
    id: string,
    updates: Partial<{
      status: ModerationCaseStatus;
      assignedTo: string | null;
      priority: number;
      notes: string | null;
      resolvedAt: Date | null;
    }>,
  ): Promise<ModerationCaseEntity>;

  createAction(params: CreateActionParams): Promise<ModerationActionEntity>;
  findActionsByCaseId(caseId: string): Promise<ModerationActionEntity[]>;

  createSanction(params: CreateSanctionParams): Promise<UserSanctionEntity>;
  findSanctionById(sanctionId: string): Promise<UserSanctionEntity | null>;
  findActiveSanctionsForUser(
    userId: string,
    sanctionType?: SanctionType,
  ): Promise<UserSanctionEntity[]>;
  revokeSanction(sanctionId: string, revokedAt: Date): Promise<UserSanctionEntity | null>;

  softDeleteMessage(messageId: string): Promise<void>;
  softDeleteStory(storyId: string): Promise<void>;
  softDeleteMedia(mediaId: string): Promise<void>;
}
