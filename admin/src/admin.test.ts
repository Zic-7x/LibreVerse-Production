import { describe, expect, it, vi } from "vitest";
import {
  AdminAppShellController,
  AdminLoginUseCase,
  AuditTrailComponent,
  CasesPageController,
  ExecuteModerationActionUseCase,
  GetAdminMeUseCase,
  GetModerationCaseDetailsUseCase,
  InMemorySessionStorage,
  ListModerationCasesUseCase,
  SubjectPreviewComponent,
  UpdateModerationCaseUseCase,
} from "./index.js";

describe("Admin Dashboard Unit Tests (M16)", () => {
  it("SessionStorage manages admin session lifecycle", async () => {
    const storage = new InMemorySessionStorage();
    expect(await storage.getSession()).toBeNull();

    await storage.setSession({
      user: { id: "mod-1", email: "mod@platform.internal", phoneE164: null, status: "active", role: "moderator" },
      accessToken: "mod-access-1",
      refreshToken: "mod-refresh-1",
    });

    const session = await storage.getSession();
    expect(session?.user.role).toBe("moderator");

    await storage.clearSession();
    expect(await storage.getSession()).toBeNull();
  });

  it("Access Control: Rejects users without moderator or admin role", async () => {
    const mockAuthRepo = {
      login: vi.fn().mockResolvedValue({
        user: { id: "u-normal", email: "user@test.com", phoneE164: null, status: "active", role: "user" },
        accessToken: "user-token",
        refreshToken: "user-ref",
      }),
      getMe: vi.fn().mockResolvedValue({
        id: "u-normal",
        email: "user@test.com",
        phoneE164: null,
        status: "active",
        role: "user",
      }),
      logout: vi.fn(),
    };

    const loginUseCase = new AdminLoginUseCase(mockAuthRepo);
    const getMeUseCase = new GetAdminMeUseCase(mockAuthRepo);

    await expect(loginUseCase.execute({ email: "user@test.com", password: "password" })).rejects.toThrow(
      "Access denied: Moderator or Admin role required.",
    );

    await expect(getMeUseCase.execute("user-token")).rejects.toThrow(
      "Access denied: Moderator or Admin role required.",
    );
  });

  it("Moderator Auth: Allows moderator user to log in", async () => {
    const mockAuthRepo = {
      login: vi.fn().mockResolvedValue({
        user: { id: "mod-1", email: "mod@test.com", phoneE164: null, status: "active", role: "moderator" },
        accessToken: "mod-token",
        refreshToken: "mod-ref",
      }),
      getMe: vi.fn(),
      logout: vi.fn(),
    };

    const loginUseCase = new AdminLoginUseCase(mockAuthRepo);
    const session = await loginUseCase.execute({ email: "mod@test.com", password: "password" });
    expect(session.user.role).toBe("moderator");
    expect(session.accessToken).toBe("mod-token");
  });

  it("Moderation Queue & Case Actions: Triage, Assign, Execute Action", async () => {
    const mockModRepo = {
      listCases: vi.fn().mockResolvedValue([
        {
          id: "case-1",
          reportId: "rep-1",
          subjectType: "message",
          subjectId: "msg-123",
          status: "open",
          assignedModeratorId: null,
          priority: 2,
          notes: null,
          createdAt: "2026-08-03T00:00:00Z",
          updatedAt: "2026-08-03T00:00:00Z",
        },
      ]),
      getCaseById: vi.fn().mockResolvedValue({
        case: {
          id: "case-1",
          reportId: "rep-1",
          subjectType: "message",
          subjectId: "msg-123",
          status: "under_review",
          assignedModeratorId: "mod-1",
          priority: 2,
          notes: null,
          createdAt: "2026-08-03T00:00:00Z",
          updatedAt: "2026-08-03T00:00:00Z",
        },
        actions: [
          {
            id: "act-1",
            caseId: "case-1",
            actorUserId: "mod-1",
            actionType: "remove_content",
            reason: "Hate speech policy violation",
            metadata: null,
            createdAt: "2026-08-03T01:00:00Z",
          },
        ],
      }),
      updateCase: vi.fn().mockResolvedValue({
        id: "case-1",
        reportId: "rep-1",
        subjectType: "message",
        subjectId: "msg-123",
        status: "under_review",
        assignedModeratorId: "mod-1",
        priority: 2,
        notes: null,
        createdAt: "2026-08-03T00:00:00Z",
        updatedAt: "2026-08-03T00:00:00Z",
      }),
      executeAction: vi.fn().mockResolvedValue({
        id: "act-1",
        caseId: "case-1",
        actorUserId: "mod-1",
        actionType: "remove_content",
        reason: "Hate speech policy violation",
        metadata: null,
        createdAt: "2026-08-03T01:00:00Z",
      }),
      revokeSanction: vi.fn(),
    };

    const listCasesUseCase = new ListModerationCasesUseCase(mockModRepo);
    const updateCaseUseCase = new UpdateModerationCaseUseCase(mockModRepo);
    const getCaseDetailsUseCase = new GetModerationCaseDetailsUseCase(mockModRepo);
    const executeActionUseCase = new ExecuteModerationActionUseCase(mockModRepo);

    const casesPage = new CasesPageController(listCasesUseCase, updateCaseUseCase);
    const cases = await casesPage.loadCases("mod-token", { status: "open" });
    expect(cases).toHaveLength(1);

    const assigned = await casesPage.assignToModerator("mod-token", "case-1", "mod-1");
    expect(assigned.assignedModeratorId).toBe("mod-1");

    const details = await getCaseDetailsUseCase.execute("mod-token", "case-1");
    expect(details.actions).toHaveLength(1);

    const action = await executeActionUseCase.execute("mod-token", "case-1", {
      actionType: "remove_content",
      reason: "Hate speech policy violation",
    });
    expect(action.actionType).toBe("remove_content");
  });

  it("SubjectPreview and AuditTrail presentation components formatting", () => {
    const previewComp = new SubjectPreviewComponent();
    const preview = previewComp.renderPreview({
      subjectType: "message",
      subjectId: "msg-99",
      contentSnippet: "Inappropriate content text",
      authorOrOwnerId: "user-bad",
    });

    expect(preview.headline).toContain("msg-99");
    expect(preview.body).toBe("Inappropriate content text");

    const auditComp = new AuditTrailComponent();
    const trail = auditComp.formatActionLog([
      {
        id: "act-10",
        caseId: "case-1",
        actorUserId: "mod-1",
        actionType: "suspend",
        reason: "Repeated violations",
        metadata: null,
        createdAt: "2026-08-03T02:00:00Z",
      },
    ]);

    expect(trail[0].actionType).toBe("SUSPEND");
    expect(trail[0].reason).toBe("Repeated violations");
  });

  it("AdminAppShellController manages tab and state transitions", () => {
    const controller = new AdminAppShellController();
    expect(controller.getState().currentTab).toBe("cases");

    controller.setSelectedCase("case-100");
    expect(controller.getState().currentTab).toBe("case_detail");
    expect(controller.getState().selectedCaseId).toBe("case-100");
  });
});
