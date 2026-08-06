import type {
  ExecuteModerationActionUseCase,
  GetModerationCaseDetailsUseCase,
} from "../../application/use-cases/moderation-use-cases.js";
import type { ModerationAction, ModerationCaseDetails } from "../../domain/entities/moderation-case.js";
import type { CreateModerationActionInput } from "@platform/shared-types";

export class CaseDetailPageController {
  constructor(
    private readonly getCaseDetailsUseCase: GetModerationCaseDetailsUseCase,
    private readonly executeActionUseCase: ExecuteModerationActionUseCase,
  ) {}

  async loadCase(token: string, caseId: string): Promise<ModerationCaseDetails> {
    return this.getCaseDetailsUseCase.execute(token, caseId);
  }

  async resolveCase(token: string, caseId: string, actionInput: CreateModerationActionInput): Promise<ModerationAction> {
    return this.executeActionUseCase.execute(token, caseId, actionInput);
  }
}
