import { describe, expect, it } from "vitest";
import {
  validateAddMemberInput,
  validateCreateCommunityInput,
  validateTransferOwnershipInput,
  validateUpdateCommunityInput,
  validateUpdateMemberRoleInput,
} from "./community-validation.js";

describe("community-validation", () => {
  it("validates create community input", () => {
    const res = validateCreateCommunityInput({
      name: "   Developers Hub   ",
      slug: "dev-hub",
      description: "A community for devs",
      visibility: "public",
    });

    expect(res.name).toBe("Developers Hub");
    expect(res.slug).toBe("dev-hub");
    expect(res.description).toBe("A community for devs");
    expect(res.visibility).toBe("public");
  });

  it("throws error on invalid slug", () => {
    expect(() =>
      validateCreateCommunityInput({
        name: "Devs",
        slug: "Dev Hub!", // uppercase, space, exclam
      }),
    ).toThrow(/Slug must be 3-50 characters/);
  });

  it("validates update community input", () => {
    const res = validateUpdateCommunityInput({
      name: "New Name",
      visibility: "private",
    });

    expect(res.name).toBe("New Name");
    expect(res.visibility).toBe("private");
  });

  it("validates update member role input", () => {
    const res = validateUpdateMemberRoleInput({ role: "admin" });
    expect(res.role).toBe("admin");
  });

  it("validates transfer ownership input", () => {
    const res = validateTransferOwnershipInput({
      newOwnerUserId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(res.newOwnerUserId).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("validates add member input", () => {
    const res = validateAddMemberInput({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      role: "moderator",
    });
    expect(res.userId).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(res.role).toBe("moderator");
  });
});
