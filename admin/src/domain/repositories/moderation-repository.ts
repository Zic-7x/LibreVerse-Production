import type {
  CreateModerationActionInput,
  ModerationAction,
  ModerationCase,
  ModerationCaseDetails,
  ModerationCaseStatus,
  ReportSubjectType,
  UpdateModerationCaseInput,
  UserSanction,
} from "../entities/moderation-case.js";

export interface ListCasesFilter {
  status?: ModerationCaseStatus;
  subjectType?: ReportSubjectType;
  assignedModeratorId?: string;
}

export interface ModerationRepository {
  listCases(token: string, filter?: ListCasesFilter): Promise<ModerationCase[]>;
  getCaseById(token: string, id: string): Promise<ModerationCaseDetails>;
  updateCase(token: string, id: string, input: UpdateModerationCaseInput): Promise<ModerationCase>;
  executeAction(token: string, id: string, input: CreateModerationActionInput): Promise<ModerationAction>;
  revokeSanction(token: string, sanctionId: string, reason: string): Promise<UserSanction>;
}
