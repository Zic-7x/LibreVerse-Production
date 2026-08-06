import { describe, expect, it } from "vitest";
import { getOrderedPair } from "./friendship-entities.js";

describe("friendship-entities ordering invariant", () => {
  it("enforces canonical low/high ordering regardless of argument order", () => {
    const uuidA = "11111111-1111-1111-1111-111111111111";
    const uuidB = "22222222-2222-2222-2222-222222222222";

    const pair1 = getOrderedPair(uuidA, uuidB);
    const pair2 = getOrderedPair(uuidB, uuidA);

    expect(pair1.userIdLow).toBe(uuidA);
    expect(pair1.userIdHigh).toBe(uuidB);
    expect(pair2.userIdLow).toBe(uuidA);
    expect(pair2.userIdHigh).toBe(uuidB);
  });

  it("throws when userA equals userB", () => {
    const uuidA = "11111111-1111-1111-1111-111111111111";
    expect(() => getOrderedPair(uuidA, uuidA)).toThrow(
      "Cannot form friendship pair with self",
    );
  });
});
