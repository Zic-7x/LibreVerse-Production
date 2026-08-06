import type { ReportSubject, ReportSubjectType } from "@platform/shared-types";
import type { ReportEntity } from "../../domain/entities/report-entities.js";

export interface CreateReportParams {
  reporterUserId: string;
  reasonCode: string;
  description?: string | null;
  subjects: ReportSubject[];
}

export interface SubjectValidationResult {
  exists: boolean;
  ownerUserId?: string | null;
  conversationId?: string | null;
}

export interface ReportRepository {
  createReport(params: CreateReportParams): Promise<ReportEntity>;
  findById(id: string): Promise<ReportEntity | null>;
  findByReporter(reporterUserId: string): Promise<ReportEntity[]>;
  findActiveDuplicate(
    reporterUserId: string,
    reasonCode: string,
    subjects: ReportSubject[],
  ): Promise<ReportEntity | null>;
  validateSubjectExists(
    subjectType: ReportSubjectType,
    subjectId: string,
  ): Promise<SubjectValidationResult>;
  isConversationParticipant(
    conversationId: string,
    userId: string,
  ): Promise<boolean>;
  getReportCountInWindow(
    reporterUserId: string,
    windowMinutes: number,
  ): Promise<number>;
}
