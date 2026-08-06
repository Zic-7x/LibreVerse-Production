import { describe, expect, it } from "vitest";
import { validateSendMessageInput } from "./messaging-validation.js";

describe("messaging-validation for rich messages", () => {
  it("validates valid text message", () => {
    const res = validateSendMessageInput({
      body: "Hello world",
    });
    expect(res.messageType).toBe("text");
    expect(res.body).toBe("Hello world");
  });

  it("validates media message with valid mediaIds", () => {
    const res = validateSendMessageInput({
      messageType: "media",
      mediaIds: ["550e8400-e29b-41d4-a716-446655440000"],
      body: "Check out this image",
    });
    expect(res.messageType).toBe("media");
    expect(res.mediaIds).toEqual(["550e8400-e29b-41d4-a716-446655440000"]);
    expect(res.body).toBe("Check out this image");
  });

  it("throws error for media message without mediaIds", () => {
    expect(() =>
      validateSendMessageInput({
        messageType: "media",
        mediaIds: [],
      }),
    ).toThrow(/mediaIds must be a non-empty array/);
  });

  it("validates location message with valid coordinates", () => {
    const res = validateSendMessageInput({
      messageType: "location",
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        title: "San Francisco",
      },
    });
    expect(res.messageType).toBe("location");
    expect(res.location?.latitude).toBe(37.7749);
    expect(res.location?.longitude).toBe(-122.4194);
    expect(res.location?.title).toBe("San Francisco");
  });

  it("throws error for invalid latitude/longitude", () => {
    expect(() =>
      validateSendMessageInput({
        messageType: "location",
        location: {
          latitude: 100, // invalid
          longitude: -122.4194,
        },
      }),
    ).toThrow(/latitude must be a number between -90 and 90/);

    expect(() =>
      validateSendMessageInput({
        messageType: "location",
        location: {
          latitude: 37.7749,
          longitude: 200, // invalid
        },
      }),
    ).toThrow(/longitude must be a number between -180 and 180/);
  });
});
