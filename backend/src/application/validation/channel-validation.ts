import type {
  CreateChannelInput,
  UpdateChannelInput,
} from "@platform/shared-types";
import { ApplicationError } from "../errors/application-error.js";

export function validateCreateChannelInput(raw: unknown): CreateChannelInput {
  if (!raw || typeof raw !== "object") {
    throw new ApplicationError("VALIDATION_ERROR", "Input must be an object");
  }

  const input = raw as Record<string, unknown>;

  if (
    typeof input.title !== "string" ||
    input.title.trim().length < 1 ||
    input.title.trim().length > 50
  ) {
    throw new ApplicationError(
      "VALIDATION_ERROR",
      "Channel title must be between 1 and 50 characters",
    );
  }

  return {
    title: input.title.trim().toLowerCase().replace(/\s+/g, "-"),
  };
}

export function validateUpdateChannelInput(raw: unknown): UpdateChannelInput {
  if (!raw || typeof raw !== "object") {
    throw new ApplicationError("VALIDATION_ERROR", "Input must be an object");
  }

  const input = raw as Record<string, unknown>;

  if (
    typeof input.title !== "string" ||
    input.title.trim().length < 1 ||
    input.title.trim().length > 50
  ) {
    throw new ApplicationError(
      "VALIDATION_ERROR",
      "Channel title must be between 1 and 50 characters",
    );
  }

  return {
    title: input.title.trim().toLowerCase().replace(/\s+/g, "-"),
  };
}
