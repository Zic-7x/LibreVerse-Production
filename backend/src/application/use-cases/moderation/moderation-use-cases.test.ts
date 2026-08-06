import { describe, expect, it, vi } from "vitest";
import type { User } from "../../../domain/entities/auth-entities.js";
import type {
  ModerationActionEntity,
  ModerationCaseEntity,
  UserSanctionEntity,
} from "../../../domain/entities/moderation-entities.js";
import type { SessionRepository, UserRepository } from "../../interfaces/auth.js";
import type { ModerationRepository } from "../../interfaces/moderation.js";
import {
  ExecuteModerationActionUseCase,
  GetModerationCaseByIdUseCase,
  ListModerationCasesUseCase,
  RevokeSanctionUseCase,
  UpdateModerationCaseUseCase,
} from "./moderation-use-cases.js";

function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    email: "user@example.com",
    phoneE164: null,
    passwordHash: "hash",
    status: "active",
    role: "user",
    deletedAt: null,
    ...overrides,
  };
}

function createMockModerator(overrides: Partial<User> = {}): User {
  return createMockUser({
    id: "mod-1",
    role: "moderator",
    ...overrides,
  });
}

function createMockCase(overrides: Partial<ModerationCaseEntity> = {}): ModerationCaseEntity {
  return {
    id: "case-1",
    reportId: "report-1",
    subjectType: "message",
    subjectId: "msg-123",
    status: "open",
    assignedTo: null,
    priority: 0,
    openedAt: new Date(),
    resolvedAt: null,
    notes: null,
    ...overrides,
  };
}

describe("Moderation Use Cases Unit Tests", () => {
  it("ListModerationCasesUseCase throws FORBIDDEN for non-moderators and returns cases for moderators", async () => {
    const mockUserRepo: Partial<UserRepository> = {
      findById: vi.fn().mockImplementation(async (id: string) => {
        if (id === "user-1") return createMockUser();
        if (id === "mod-1") return createMockModerator();
        return null;
      }),
    };

    const mockCase = createMockCase();
    const mockModerationRepo: Partial<ModerationRepository> = {
      listCases: vi.fn().mockResolvedValue([mockCase]),
    };

    const listUseCase = new ListModerationCasesUseCase(
      mockModerationRepo as ModerationRepository,
      mockUserRepo as UserRepository,
    );

    // Non-moderator throws FORBIDDEN
    await expect(listUseCase.execute("user-1")).rejects.toThrow("Moderator or admin access required");

    // Moderator succeeds
    const cases = await listUseCase.execute("mod-1");
    expect(cases).toHaveLength(1);
    expect(cases[0].id).toBe("case-1");
  });

  it("ExecuteModerationActionUseCase applies suspend sanction and revokes user sessions", async () => {
    const targetUser = createMockUser({ id: "offender-1", status: "active" });
    const modUser = createMockModerator();

    const mockUserRepo: Partial<UserRepository> = {
      findById: vi.fn().mockImplementation(async (id: string) => {
        if (id === "mod-1") return modUser;
        if (id === "offender-1") return targetUser;
        return null;
      }),
      updateStatus: vi.fn().mockResolvedValue(undefined),
    };

    const mockSessionRepo: Partial<SessionRepository> = {
      revokeAllForUser: vi.fn().mockResolvedValue(undefined),
    };

    const mockCase = createMockCase({ subjectType: "user", subjectId: "offender-1" });
    const mockAction: ModerationActionEntity = {
      id: "action-1",
      caseId: "case-1",
      moderatorUserId: "mod-1",
      actionType: "suspend",
      reason: "Harassment",
      metadata: {},
      effectiveUntil: null,
      createdAt: new Date(),
    };
    const mockSanction: UserSanctionEntity = {
      id: "sanction-1",
      userId: "offender-1",
      sanctionType: "suspend",
      sourceActionId: "action-1",
      startsAt: new Date(),
      endsAt: null,
      revokedAt: null,
    };

    const mockModerationRepo: Partial<ModerationRepository> = {
      findCaseById: vi.fn().mockResolvedValue(mockCase),
      createAction: vi.fn().mockResolvedValue(mockAction),
      createSanction: vi.fn().mockResolvedValue(mockSanction),
      updateCase: vi.fn().mockResolvedValue({ ...mockCase, status: "resolved" }),
    };

    const executeActionUseCase = new ExecuteModerationActionUseCase(
      mockModerationRepo as ModerationRepository,
      mockUserRepo as UserRepository,
      mockSessionRepo as SessionRepository,
    );

    const result = await executeActionUseCase.execute("mod-1", "case-1", {
      actionType: "suspend",
      reason: "Harassment",
      targetUserId: "offender-1",
    });

    expect(result.action.actionType).toBe("suspend");
    expect(result.sanction?.sanctionType).toBe("suspend");
    expect(mockUserRepo.updateStatus).toHaveBeenCalledWith("offender-1", "suspended");
    expect(mockSessionRepo.revokeAllForUser).toHaveBeenCalledWith("offender-1", expect.any(Date));
  });

  it("ExecuteModerationActionUseCase soft deletes message on remove_content", async () => {
    const modUser = createMockModerator();
    const mockUserRepo: Partial<UserRepository> = {
      findById: vi.fn().mockResolvedValue(modUser),
    };

    const mockCase = createMockCase({ subjectType: "message", subjectId: "msg-999" });
    const mockAction: ModerationActionEntity = {
      id: "action-2",
      caseId: "case-1",
      moderatorUserId: "mod-1",
      actionType: "remove_content",
      reason: "Spam",
      metadata: {},
      effectiveUntil: null,
      createdAt: new Date(),
    };

    const mockModerationRepo: Partial<ModerationRepository> = {
      findCaseById: vi.fn().mockResolvedValue(mockCase),
      createAction: vi.fn().mockResolvedValue(mockAction),
      softDeleteMessage: vi.fn().mockResolvedValue(undefined),
      updateCase: vi.fn().mockResolvedValue({ ...mockCase, status: "resolved" }),
    };

    const executeActionUseCase = new ExecuteModerationActionUseCase(
      mockModerationRepo as ModerationRepository,
      mockUserRepo as UserRepository,
      {} as SessionRepository,
    );

    await executeActionUseCase.execute("mod-1", "case-1", {
      actionType: "remove_content",
      reason: "Spam",
    });

    expect(mockModerationRepo.softDeleteMessage).toHaveBeenCalledWith("msg-999");
  });

  it("RevokeSanctionUseCase revokes sanction and restores user active status if no other active sanctions", async () => {
    const modUser = createMockModerator();
    const mockUserRepo: Partial<UserRepository> = {
      findById: vi.fn().mockResolvedValue(modUser),
      updateStatus: vi.fn().mockResolvedValue(undefined),
    };

    const mockSanction: UserSanctionEntity = {
      id: "sanc-100",
      userId: "user-suspended-1",
      sanctionType: "suspend",
      sourceActionId: "act-1",
      startsAt: new Date(),
      endsAt: null,
      revokedAt: null,
    };

    const mockModerationRepo: Partial<ModerationRepository> = {
      findSanctionById: vi.fn().mockResolvedValue(mockSanction),
      revokeSanction: vi.fn().mockResolvedValue({ ...mockSanction, revokedAt: new Date() }),
      findActiveSanctionsForUser: vi.fn().mockResolvedValue([]),
    };

    const revokeUseCase = new RevokeSanctionUseCase(
      mockModerationRepo as ModerationRepository,
      mockUserRepo as UserRepository,
    );

    const revoked = await revokeUseCase.execute("mod-1", "sanc-100");
    expect(revoked.revokedAt).toBeDefined();
    expect(mockUserRepo.updateStatus).toHaveBeenCalledWith("user-suspended-1", "active");
  });

  it("GetModerationCaseByIdUseCase returns case and actions audit log", async () => {
    const modUser = createMockModerator();
    const mockUserRepo: Partial<UserRepository> = {
      findById: vi.fn().mockResolvedValue(modUser),
    };

    const mockCase = createMockCase({ id: "case-99" });
    const mockAction: ModerationActionEntity = {
      id: "act-1",
      caseId: "case-99",
      moderatorUserId: "mod-1",
      actionType: "warn",
      reason: "Initial warning",
      metadata: {},
      effectiveUntil: null,
      createdAt: new Date(),
    };

    const mockModerationRepo: Partial<ModerationRepository> = {
      findCaseById: vi.fn().mockResolvedValue(mockCase),
      findActionsByCaseId: vi.fn().mockResolvedValue([mockAction]),
    };

    const getCaseUseCase = new GetModerationCaseByIdUseCase(
      mockModerationRepo as ModerationRepository,
      mockUserRepo as UserRepository,
    );

    const result = await getCaseUseCase.execute("mod-1", "case-99");
    expect(result.case.id).toBe("case-99");
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].actionType).toBe("warn");
  });

  it("UpdateModerationCaseUseCase updates status and priority", async () => {
    const modUser = createMockModerator();
    const mockUserRepo: Partial<UserRepository> = {
      findById: vi.fn().mockResolvedValue(modUser),
    };

    const mockCase = createMockCase({ id: "case-99", priority: 0 });
    const mockModerationRepo: Partial<ModerationRepository> = {
      findCaseById: vi.fn().mockResolvedValue(mockCase),
      updateCase: vi.fn().mockResolvedValue({ ...mockCase, priority: 5, status: "escalated" }),
    };

    const updateCaseUseCase = new UpdateModerationCaseUseCase(
      mockModerationRepo as ModerationRepository,
      mockUserRepo as UserRepository,
    );

    const updated = await updateCaseUseCase.execute("mod-1", "case-99", {
      priority: 5,
      status: "escalated",
    });

    expect(updated.priority).toBe(5);
    expect(updated.status).toBe("escalated");
  });
});
