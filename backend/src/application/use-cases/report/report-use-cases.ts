import type { CreateReportInput } from "@platform/shared-types";
import { ApplicationError } from "../../errors/application-error.js";
import type { ReportRepository } from "../../interfaces/report.js";
import type { ReportEntity } from "../../../domain/entities/report-entities.js";

export class SubmitReportUseCase {
  constructor(private readonly reportRepo: ReportRepository) {}

  async execute(
    reporterUserId: string,
    input: CreateReportInput,
  ): Promise<ReportEntity> {
    if (!input.reasonCode || input.reasonCode.trim() === "") {
      throw new ApplicationError("VALIDATION_ERROR", "reason_code is required");
    }

    if (!input.subjects || !Array.isArray(input.subjects) || input.subjects.length === 0) {
      throw new ApplicationError("VALIDATION_ERROR", "At least one subject is required");
    }

    // Rate limiting: max 10 reports per hour
    const recentCount = await this.reportRepo.getReportCountInWindow(
      reporterUserId,
      60,
    );
    if (recentCount >= 10) {
      throw new ApplicationError(
        "TOO_MANY_REQUESTS",
        "Report rate limit exceeded. Please try again later.",
      );
    }

    // Duplicate check
    const duplicate = await this.reportRepo.findActiveDuplicate(
      reporterUserId,
      input.reasonCode,
      input.subjects,
    );
    if (duplicate) {
      throw new ApplicationError(
        "CONFLICT",
        "A duplicate report for this content is already pending review",
      );
    }

    // Validate subjects & authorization
    for (const sub of input.subjects) {
      const val = await this.reportRepo.validateSubjectExists(
        sub.subjectType,
        sub.subjectId,
      );

      if (!val.exists) {
        throw new ApplicationError(
          "NOT_FOUND",
          `Subject not found: ${sub.subjectType} ${sub.subjectId}`,
        );
      }

      // Cannot report self or own content
      if (val.ownerUserId === reporterUserId) {
        throw new ApplicationError(
          "VALIDATION_ERROR",
          "Cannot report yourself or your own content",
        );
      }

      // Private message authorization check
      if (sub.subjectType === "message" && val.conversationId) {
        const isParticipant = await this.reportRepo.isConversationParticipant(
          val.conversationId,
          reporterUserId,
        );
        if (!isParticipant) {
          throw new ApplicationError(
            "FORBIDDEN",
            "Only participants can report a private message",
          );
        }
      }
    }

    return this.reportRepo.createReport({
      reporterUserId,
      reasonCode: input.reasonCode,
      description: input.description,
      subjects: input.subjects,
    });
  }
}

export class GetReportByIdUseCase {
  constructor(private readonly reportRepo: ReportRepository) {}

  async execute(reporterUserId: string, reportId: string): Promise<ReportEntity> {
    const report = await this.reportRepo.findById(reportId);
    if (!report) {
      throw new ApplicationError("NOT_FOUND", "Report not found");
    }

    if (report.reporterUserId !== reporterUserId) {
      throw new ApplicationError("FORBIDDEN", "Access denied");
    }

    return report;
  }
}


export class ListUserReportsUseCase {
  constructor(private readonly reportRepo: ReportRepository) {}

  async execute(reporterUserId: string): Promise<ReportEntity[]> {
    return this.reportRepo.findByReporter(reporterUserId);
  }
}
