import type {
  ListModerationCasesUseCase,
  UpdateModerationCaseUseCase,
} from "../../application/use-cases/moderation-use-cases.js";
import type { ModerationCase } from "../../domain/entities/moderation-case.js";
import type { ListCasesFilter } from "../../domain/repositories/moderation-repository.js";

export class CasesPageController {
  constructor(
    private readonly listCasesUseCase: ListModerationCasesUseCase,
    private readonly updateCaseUseCase: UpdateModerationCaseUseCase,
  ) {}

  async loadCases(token: string, filter?: ListCasesFilter): Promise<ModerationCase[]> {
    return this.listCasesUseCase.execute(token, filter);
  }

  async assignToModerator(token: string, caseId: string, moderatorUserId: string): Promise<ModerationCase> {
    return this.updateCaseUseCase.execute(token, caseId, {
      assignedTo: moderatorUserId,
      status: "escalated",
    });
  }
}
