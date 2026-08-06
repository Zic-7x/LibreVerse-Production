import { describe, expect, it } from "vitest";
import { ApplicationError } from "../errors/application-error.js";
import {
  normalizeEmail,
  validateLoginIdentifier,
  validateRegistrationInput,
} from "./auth-validation.js";

describe("auth validation", () => {
  it("normalizes email to lowercase", () => {
    expect(normalizeEmail("User@Example.COM")).toBe("user@example.com");
  });

  it("accepts valid registration with email", () => {
    const result = validateRegistrationInput({
      email: "user@example.com",
      password: "password123",
    });
    expect(result.email).toBe("user@example.com");
    expect(result.phoneE164).toBeNull();
  });

  it("rejects registration without contact", () => {
    expect(() =>
      validateRegistrationInput({ password: "password123" }),
    ).toThrow(ApplicationError);
  });

  it("rejects short password", () => {
    expect(() =>
      validateRegistrationInput({
        email: "user@example.com",
        password: "short",
      }),
    ).toThrow(ApplicationError);
  });

  it("requires single login identifier", () => {
    expect(() =>
      validateLoginIdentifier({
        email: "a@b.com",
        phone: "+15551234567",
      }),
    ).toThrow(ApplicationError);
  });
});
