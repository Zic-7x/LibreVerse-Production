import { ApplicationError } from "../errors/application-error.js";

export function validateInitUploadInput(input: {
  mimeType?: unknown;
  byteSize?: unknown;
}): { mimeType: string; byteSize: number } {
  if (typeof input.mimeType !== "string" || !input.mimeType.trim()) {
    throw new ApplicationError("VALIDATION_ERROR", "mimeType must be a non-empty string");
  }

  const mimeType = input.mimeType.trim().toLowerCase();
  if (!mimeType.includes("/")) {
    throw new ApplicationError("VALIDATION_ERROR", "Invalid mimeType format");
  }

  if (typeof input.byteSize !== "number" || !Number.isInteger(input.byteSize) || input.byteSize <= 0) {
    throw new ApplicationError("VALIDATION_ERROR", "byteSize must be a positive integer");
  }

  if (input.byteSize > 100 * 1024 * 1024) {
    throw new ApplicationError("VALIDATION_ERROR", "File size exceeds 100MB limit");
  }

  return { mimeType, byteSize: input.byteSize };
}

export function validateCompleteUploadInput(input: {
  checksumSha256?: unknown;
  widthPx?: unknown;
  heightPx?: unknown;
  durationMs?: unknown;
}): {
  checksumSha256?: string;
  widthPx?: number;
  heightPx?: number;
  durationMs?: number;
} {
  const result: ReturnType<typeof validateCompleteUploadInput> = {};

  if (input.checksumSha256 !== undefined) {
    if (
      typeof input.checksumSha256 !== "string" ||
      !/^[a-fA-F0-9]{64}$/.test(input.checksumSha256)
    ) {
      throw new ApplicationError("VALIDATION_ERROR", "checksumSha256 must be a 64-character hex string");
    }
    result.checksumSha256 = input.checksumSha256.toLowerCase();
  }

  if (input.widthPx !== undefined) {
    if (typeof input.widthPx !== "number" || !Number.isInteger(input.widthPx) || input.widthPx <= 0) {
      throw new ApplicationError("VALIDATION_ERROR", "widthPx must be a positive integer");
    }
    result.widthPx = input.widthPx;
  }

  if (input.heightPx !== undefined) {
    if (typeof input.heightPx !== "number" || !Number.isInteger(input.heightPx) || input.heightPx <= 0) {
      throw new ApplicationError("VALIDATION_ERROR", "heightPx must be a positive integer");
    }
    result.heightPx = input.heightPx;
  }

  if (input.durationMs !== undefined) {
    if (typeof input.durationMs !== "number" || !Number.isInteger(input.durationMs) || input.durationMs <= 0) {
      throw new ApplicationError("VALIDATION_ERROR", "durationMs must be a positive integer");
    }
    result.durationMs = input.durationMs;
  }

  return result;
}
