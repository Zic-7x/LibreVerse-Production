import type { GetReportDetailsUseCase, ListReportsUseCase } from "../../application/use-cases/report-use-cases.js";
import type { AdminReport } from "../../domain/entities/report.js";

export class ReportsPageController {
  constructor(
    private readonly listReportsUseCase: ListReportsUseCase,
    private readonly getReportDetailsUseCase: GetReportDetailsUseCase,
  ) {}

  async fetchAllReports(token: string): Promise<AdminReport[]> {
    return this.listReportsUseCase.execute(token);
  }

  async fetchReport(token: string, reportId: string): Promise<AdminReport> {
    return this.getReportDetailsUseCase.execute(token, reportId);
  }
}
