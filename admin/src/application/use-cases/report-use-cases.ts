import type { AdminReport } from "../../domain/entities/report.js";
import type { ReportRepository } from "../../domain/repositories/report-repository.js";

export class ListReportsUseCase {
  constructor(private readonly reportRepo: ReportRepository) {}

  async execute(token: string): Promise<AdminReport[]> {
    if (!token) throw new Error("Token is required.");
    return this.reportRepo.listReports(token);
  }
}

export class GetReportDetailsUseCase {
  constructor(private readonly reportRepo: ReportRepository) {}

  async execute(token: string, reportId: string): Promise<AdminReport> {
    if (!token || !reportId) throw new Error("Token and reportId are required.");
    return this.reportRepo.getReportById(token, reportId);
  }
}
