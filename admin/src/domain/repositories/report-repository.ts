import type { AdminReport } from "../entities/report.js";

export interface ReportRepository {
  listReports(token: string): Promise<AdminReport[]>;
  getReportById(token: string, id: string): Promise<AdminReport>;
}
