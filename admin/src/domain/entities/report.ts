import type { ReportStatus, ReportSubjectType } from "@platform/shared-types";

export interface AdminReport {
  id: string;
  reporterUserId: string;
  subjectType: ReportSubjectType;
  subjectId: string;
  reason: string;
  status: ReportStatus;
  details: string | null;
  createdAt: string;
  updatedAt: string;
}
