import type { CreateModerationActionInput, ModerationActionType } from "@platform/shared-types";
import type { ExecuteModerationActionUseCase } from "../../application/use-cases/moderation-use-cases.js";

export class ActionFormComponent {
  constructor(private readonly executeActionUseCase: ExecuteModerationActionUseCase) {}

  async submitAction(
    token: string,
    caseId: string,
    actionType: ModerationActionType,
    reason: string,
    sanctionDurationHours?: number,
  ): Promise<void> {
    const input: CreateModerationActionInput = {
      actionType,
      reason,
      ...(sanctionDurationHours ? { sanctionDurationHours } : {}),
    };

    await this.executeActionUseCase.execute(token, caseId, input);
  }
}
