import type {
  CreateModerationActionInput,
  UpdateModerationCaseInput,
} from "@platform/shared-types";
import { ApplicationError } from "../../errors/application-error.js";
import type { SessionRepository, UserRepository } from "../../interfaces/auth.js";
import type { ListCasesFilter, ModerationRepository } from "../../interfaces/moderation.js";
import type { User } from "../../../domain/entities/auth-entities.js";
import type {
  ModerationActionEntity,
  ModerationCaseEntity,
  UserSanctionEntity,
} from "../../../domain/entities/moderation-entities.js";

function assertModerator(user: User | null): void {
  if (!user || (user.role !== "moderator" && user.role !== "admin")) {
    throw new ApplicationError(
      "FORBIDDEN",
      "Moderator or admin access required",
    );
  }
}

export class ListModerationCasesUseCase {
  constructor(
    private readonly moderationRepo: ModerationRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async execute(
    moderatorUserId: string,
    filter?: ListCasesFilter,
  ): Promise<ModerationCaseEntity[]> {
    const user = await this.userRepo.findById(moderatorUserId);
    assertModerator(user);
    return this.moderationRepo.listCases(filter);
  }
}

export class GetModerationCaseByIdUseCase {
  constructor(
    private readonly moderationRepo: ModerationRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async execute(
    moderatorUserId: string,
    caseId: string,
  ): Promise<{ case: ModerationCaseEntity; actions: ModerationActionEntity[] }> {
    const user = await this.userRepo.findById(moderatorUserId);
    assertModerator(user);

    const caseEntity = await this.moderationRepo.findCaseById(caseId);
    if (!caseEntity) {
      throw new ApplicationError("NOT_FOUND", "Moderation case not found");
    }

    const actions = await this.moderationRepo.findActionsByCaseId(caseId);
    return { case: caseEntity, actions };
  }
}

export class UpdateModerationCaseUseCase {
  constructor(
    private readonly moderationRepo: ModerationRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async execute(
    moderatorUserId: string,
    caseId: string,
    input: UpdateModerationCaseInput,
  ): Promise<ModerationCaseEntity> {
    const user = await this.userRepo.findById(moderatorUserId);
    assertModerator(user);

    const caseEntity = await this.moderationRepo.findCaseById(caseId);
    if (!caseEntity) {
      throw new ApplicationError("NOT_FOUND", "Moderation case not found");
    }

    return this.moderationRepo.updateCase(caseId, {
      status: input.status,
      assignedTo: input.assignedTo,
      notes: input.notes,
      priority: input.priority,
      resolvedAt:
        input.status === "resolved" || input.status === "closed"
          ? new Date()
          : undefined,
    });
  }
}

export class ExecuteModerationActionUseCase {
  constructor(
    private readonly moderationRepo: ModerationRepository,
    private readonly userRepo: UserRepository,
    private readonly sessionRepo: SessionRepository,
  ) {}

  async execute(
    moderatorUserId: string,
    caseId: string,
    input: CreateModerationActionInput,
  ): Promise<{
    action: ModerationActionEntity;
    sanction?: UserSanctionEntity;
  }> {
    const moderator = await this.userRepo.findById(moderatorUserId);
    assertModerator(moderator);

    const caseEntity = await this.moderationRepo.findCaseById(caseId);
    if (!caseEntity) {
      throw new ApplicationError("NOT_FOUND", "Moderation case not found");
    }

    const effectiveUntil = input.effectiveUntil
      ? new Date(input.effectiveUntil)
      : null;

    const action = await this.moderationRepo.createAction({
      caseId,
      moderatorUserId,
      actionType: input.actionType,
      reason: input.reason || null,
      metadata: input.metadata || {},
      effectiveUntil,
    });

    let sanction: UserSanctionEntity | undefined;

    // Target user determination
    let targetUserId = input.targetUserId;
    if (!targetUserId && caseEntity.subjectType === "user") {
      targetUserId = caseEntity.subjectId;
    }

    if (
      ["mute", "suspend", "ban"].includes(input.actionType) &&
      targetUserId
    ) {
      const sanctionType = input.actionType as "mute" | "suspend" | "ban";
      sanction = await this.moderationRepo.createSanction({
        userId: targetUserId,
        sanctionType,
        sourceActionId: action.id,
        startsAt: new Date(),
        endsAt: sanctionType === "ban" ? null : effectiveUntil,
      });

      if (sanctionType === "suspend" || sanctionType === "ban") {
        await this.userRepo.updateStatus(targetUserId, "suspended");
        await this.sessionRepo.revokeAllForUser(targetUserId, new Date());
      }
    }

    if (input.actionType === "remove_content") {
      if (caseEntity.subjectType === "message") {
        await this.moderationRepo.softDeleteMessage(caseEntity.subjectId);
      } else if (caseEntity.subjectType === "story") {
        await this.moderationRepo.softDeleteStory(caseEntity.subjectId);
      } else if (caseEntity.subjectType === "media") {
        await this.moderationRepo.softDeleteMedia(caseEntity.subjectId);
      }
    }

    // Resolve or close case upon action unless action is warn
    const newStatus =
      input.actionType === "dismiss" ? "closed" : "resolved";
    await this.moderationRepo.updateCase(caseId, {
      status: newStatus,
      resolvedAt: new Date(),
    });

    return { action, sanction };
  }
}

export class RevokeSanctionUseCase {
  constructor(
    private readonly moderationRepo: ModerationRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async execute(
    moderatorUserId: string,
    sanctionId: string,
  ): Promise<UserSanctionEntity> {
    const moderator = await this.userRepo.findById(moderatorUserId);
    assertModerator(moderator);

    const sanction = await this.moderationRepo.findSanctionById(sanctionId);
    if (!sanction) {
      throw new ApplicationError("NOT_FOUND", "Sanction not found");
    }

    const revoked = await this.moderationRepo.revokeSanction(
      sanctionId,
      new Date(),
    );
    if (!revoked) {
      throw new ApplicationError("NOT_FOUND", "Failed to revoke sanction");
    }

    if (sanction.sanctionType === "suspend" || sanction.sanctionType === "ban") {
      const activeSanctions =
        await this.moderationRepo.findActiveSanctionsForUser(sanction.userId);
      const activeSuspendOrBan = activeSanctions.some(
        (s) => s.sanctionType === "suspend" || s.sanctionType === "ban",
      );

      if (!activeSuspendOrBan) {
        await this.userRepo.updateStatus(sanction.userId, "active");
      }
    }

    return revoked;
  }
}
