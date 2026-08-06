import { describe, expect, it } from "vitest";
import { isNonEmptyString } from "./index.js";

describe("domain-core", () => {
  it("isNonEmptyString rejects whitespace", () => {
    expect(isNonEmptyString("hello")).toBe(true);
    expect(isNonEmptyString("   ")).toBe(false);
  });
});
