import type {
  CreateModerationActionInput,
  ModerationAction,
  ModerationCase,
  ModerationCaseDetails,
  UpdateModerationCaseInput,
  UserSanction,
} from "../../domain/entities/moderation-case.js";
import type { ListCasesFilter, ModerationRepository } from "../../domain/repositories/moderation-repository.js";
import type { ApiClient } from "../api/api-client.js";

export class HttpModerationRepository implements ModerationRepository {
  constructor(private readonly apiClient: ApiClient) {}

  async listCases(token: string, filter?: ListCasesFilter): Promise<ModerationCase[]> {
    const queryParams = new URLSearchParams();
    if (filter?.status) queryParams.set("status", filter.status);
    if (filter?.subjectType) queryParams.set("subjectType", filter.subjectType);
    if (filter?.assignedModeratorId) queryParams.set("assignedModeratorId", filter.assignedModeratorId);

    const qs = queryParams.toString();
    const endpoint = `/moderation/cases${qs ? `?${qs}` : ""}`;

    const res = await this.apiClient.request<{ cases: ModerationCase[] }>(endpoint, {
      method: "GET",
      token,
    });
    return res.cases || [];
  }

  async getCaseById(token: string, id: string): Promise<ModerationCaseDetails> {
    const res = await this.apiClient.request<{ case: ModerationCase; actions: ModerationAction[] }>(
      `/moderation/cases/${id}`,
      {
        method: "GET",
        token,
      },
    );
    return {
      case: res.case,
      actions: res.actions || [],
    };
  }

  async updateCase(token: string, id: string, input: UpdateModerationCaseInput): Promise<ModerationCase> {
    const res = await this.apiClient.request<{ case: ModerationCase }>(`/moderation/cases/${id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify(input),
    });
    return res.case;
  }

  async executeAction(token: string, id: string, input: CreateModerationActionInput): Promise<ModerationAction> {
    const res = await this.apiClient.request<{ action: ModerationAction }>(`/moderation/cases/${id}/actions`, {
      method: "POST",
      token,
      body: JSON.stringify(input),
    });
    return res.action;
  }

  async revokeSanction(token: string, sanctionId: string, reason: string): Promise<UserSanction> {
    const res = await this.apiClient.request<{ sanction: UserSanction }>(
      `/moderation/sanctions/${sanctionId}/revoke`,
      {
        method: "POST",
        token,
        body: JSON.stringify({ reason }),
      },
    );
    return res.sanction;
  }
}
