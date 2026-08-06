import { describe, expect, it } from "vitest";
import { ApplicationError } from "../errors/application-error.js";
import {
  validateCompleteUploadInput,
  validateInitUploadInput,
} from "./media-validation.js";

describe("media-validation", () => {
  describe("validateInitUploadInput", () => {
    it("accepts valid mimeType and byteSize", () => {
      expect(
        validateInitUploadInput({
          mimeType: "image/png",
          byteSize: 1024,
        }),
      ).toEqual({
        mimeType: "image/png",
        byteSize: 1024,
      });
    });

    it("rejects empty mimeType or invalid format", () => {
      expect(() =>
        validateInitUploadInput({ mimeType: "", byteSize: 100 }),
      ).toThrow(ApplicationError);
      expect(() =>
        validateInitUploadInput({ mimeType: "invalidmime", byteSize: 100 }),
      ).toThrow(ApplicationError);
    });

    it("rejects non-positive or oversized byteSize", () => {
      expect(() =>
        validateInitUploadInput({ mimeType: "image/png", byteSize: 0 }),
      ).toThrow(ApplicationError);
      expect(() =>
        validateInitUploadInput({
          mimeType: "image/png",
          byteSize: 200 * 1024 * 1024,
        }),
      ).toThrow(ApplicationError);
    });
  });

  describe("validateCompleteUploadInput", () => {
    it("validates checksum, dimensions, and duration", () => {
      const validChecksum = "a".repeat(64);
      expect(
        validateCompleteUploadInput({
          checksumSha256: validChecksum,
          widthPx: 800,
          heightPx: 600,
        }),
      ).toEqual({
        checksumSha256: validChecksum,
        widthPx: 800,
        heightPx: 600,
      });
    });

    it("rejects invalid checksumSha256 format", () => {
      expect(() =>
        validateCompleteUploadInput({ checksumSha256: "not-64-hex-chars" }),
      ).toThrow(ApplicationError);
    });
  });
});
