import { describe, expect, it } from "vitest";
import { ApplicationError } from "../errors/application-error.js";
import {
  validateAliasInput,
  validateUpdateProfileInput,
} from "./profile-validation.js";

describe("profile-validation", () => {
  describe("validateAliasInput", () => {
    it("accepts valid aliases", () => {
      expect(validateAliasInput("alice")).toBe("alice");
      expect(validateAliasInput("user_123")).toBe("user_123");
      expect(validateAliasInput("  John_Doe  ")).toBe("john_doe");
    });

    it("rejects invalid characters or uppercase (after lowercasing)", () => {
      expect(() => validateAliasInput("ab")).toThrow(ApplicationError);
      expect(() => validateAliasInput("a".repeat(31))).toThrow(ApplicationError);
      expect(() => validateAliasInput("user-name")).toThrow(ApplicationError);
      expect(() => validateAliasInput("user.name")).toThrow(ApplicationError);
      expect(() => validateAliasInput("user@name")).toThrow(ApplicationError);
    });
  });

  describe("validateUpdateProfileInput", () => {
    it("validates displayName length", () => {
      expect(validateUpdateProfileInput({ displayName: "Bob" })).toEqual({
        displayName: "Bob",
      });
      expect(() => validateUpdateProfileInput({ displayName: "" })).toThrow(
        ApplicationError,
      );
      expect(() =>
        validateUpdateProfileInput({ displayName: "a".repeat(81) }),
      ).toThrow(ApplicationError);
    });

    it("validates bio length", () => {
      expect(validateUpdateProfileInput({ bio: "Hello world" })).toEqual({
        bio: "Hello world",
      });
      expect(validateUpdateProfileInput({ bio: null })).toEqual({
        bio: null,
      });
      expect(() =>
        validateUpdateProfileInput({ bio: "a".repeat(501) }),
      ).toThrow(ApplicationError);
    });
  });
});
