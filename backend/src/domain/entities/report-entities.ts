import type {
  Report as SharedReport,
  ReportStatus,
  ReportSubject,
} from "@platform/shared-types";

export interface ReportEntity {
  id: string;
  reporterUserId: string;
  reasonCode: string;
  description: string | null;
  status: ReportStatus;
  subjects: ReportSubject[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}

export function toSharedReport(entity: ReportEntity): SharedReport {
  return {
    id: entity.id,
    reporterUserId: entity.reporterUserId,
    reasonCode: entity.reasonCode,
    description: entity.description,
    status: entity.status,
    subjects: entity.subjects,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
    resolvedAt: entity.resolvedAt ? entity.resolvedAt.toISOString() : null,
  };
}
