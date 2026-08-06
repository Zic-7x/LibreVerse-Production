import type { AdminReport } from "../../domain/entities/report.js";
import type { ReportRepository } from "../../domain/repositories/report-repository.js";
import type { ApiClient } from "../api/api-client.js";

export class HttpReportRepository implements ReportRepository {
  constructor(private readonly apiClient: ApiClient) {}

  async listReports(token: string): Promise<AdminReport[]> {
    const res = await this.apiClient.request<{ reports: AdminReport[] }>("/reports", {
      method: "GET",
      token,
    });
    return res.reports || [];
  }

  async getReportById(token: string, id: string): Promise<AdminReport> {
    const res = await this.apiClient.request<{ report: AdminReport }>(`/reports/${id}`, {
      method: "GET",
      token,
    });
    return res.report;
  }
}
