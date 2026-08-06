import type {
  CreateModerationActionInput,
  ModerationAction,
  ModerationCase,
  ModerationCaseDetails,
  UpdateModerationCaseInput,
  UserSanction,
} from "../../domain/entities/moderation-case.js";
import type { ListCasesFilter, ModerationRepository } from "../../domain/repositories/moderation-repository.js";

export class ListModerationCasesUseCase {
  constructor(private readonly modRepo: ModerationRepository) {}

  async execute(token: string, filter?: ListCasesFilter): Promise<ModerationCase[]> {
    if (!token) throw new Error("Access token is required.");
    return this.modRepo.listCases(token, filter);
  }
}

export class GetModerationCaseDetailsUseCase {
  constructor(private readonly modRepo: ModerationRepository) {}

  async execute(token: string, caseId: string): Promise<ModerationCaseDetails> {
    if (!token || !caseId) throw new Error("Token and caseId are required.");
    return this.modRepo.getCaseById(token, caseId);
  }
}

export class UpdateModerationCaseUseCase {
  constructor(private readonly modRepo: ModerationRepository) {}

  async execute(token: string, caseId: string, input: UpdateModerationCaseInput): Promise<ModerationCase> {
    if (!token || !caseId) throw new Error("Token and caseId are required.");
    return this.modRepo.updateCase(token, caseId, input);
  }
}

export class ExecuteModerationActionUseCase {
  constructor(private readonly modRepo: ModerationRepository) {}

  async execute(token: string, caseId: string, input: CreateModerationActionInput): Promise<ModerationAction> {
    if (!token || !caseId) throw new Error("Token and caseId are required.");
    if (!input.actionType || !input.reason) {
      throw new Error("actionType and reason are required.");
    }
    return this.modRepo.executeAction(token, caseId, input);
  }
}

export class RevokeSanctionUseCase {
  constructor(private readonly modRepo: ModerationRepository) {}

  async execute(token: string, sanctionId: string, reason: string): Promise<UserSanction> {
    if (!token || !sanctionId || !reason) {
      throw new Error("Token, sanctionId, and reason are required.");
    }
    return this.modRepo.revokeSanction(token, sanctionId, reason);
  }
}
