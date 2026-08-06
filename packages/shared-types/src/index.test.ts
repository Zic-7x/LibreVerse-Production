import { describe, expect, it } from "vitest";
import { UserStatus } from "./index.js";

describe("shared-types enums", () => {
  it("UserStatus matches database pending default", () => {
    expect(UserStatus.Pending).toBe("pending");
    expect(Object.values(UserStatus)).toContain("active");
  });
});
