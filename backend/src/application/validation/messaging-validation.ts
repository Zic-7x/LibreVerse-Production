import type { CreateLocationInput, MessageType } from "@platform/shared-types";
import { ApplicationError } from "../errors/application-error.js";

export interface ValidatedSendMessageInput {
  messageType: MessageType;
  body: string | null;
  replyToId?: string;
  mediaIds?: string[];
  location?: CreateLocationInput;
}

export function validateSendMessageInput(rawInput: unknown): ValidatedSendMessageInput {
  if (!rawInput || typeof rawInput !== "object") {
    throw new ApplicationError("VALIDATION_ERROR", "Message input must be an object");
  }
  const input = rawInput as Record<string, unknown>;
  const messageType = (input.messageType as MessageType) || "text";

  if (!["text", "media", "location", "system"].includes(messageType)) {
    throw new ApplicationError("VALIDATION_ERROR", "Invalid messageType");
  }

  let replyToId: string | undefined;
  if (input.replyToId !== undefined && input.replyToId !== null) {
    if (typeof input.replyToId !== "string" || !input.replyToId.trim()) {
      throw new ApplicationError(
        "VALIDATION_ERROR",
        "replyToId must be a valid non-empty string",
      );
    }
    replyToId = input.replyToId.trim();
  }

  let body: string | null = null;
  if (input.body !== undefined && input.body !== null) {
    if (typeof input.body !== "string") {
      throw new ApplicationError("VALIDATION_ERROR", "Message body must be a string");
    }
    const trimmed = input.body.trim();
    if (trimmed.length > 5000) {
      throw new ApplicationError("VALIDATION_ERROR", "Message body cannot exceed 5000 characters");
    }
    body = trimmed.length > 0 ? trimmed : null;
  }

  if (messageType === "text") {
    if (!body) {
      throw new ApplicationError("VALIDATION_ERROR", "Message body must be a non-empty string for text messages");
    }
    return { messageType: "text", body, replyToId };
  }

  if (messageType === "media") {
    if (!Array.isArray(input.mediaIds) || input.mediaIds.length === 0) {
      throw new ApplicationError("VALIDATION_ERROR", "mediaIds must be a non-empty array for media messages");
    }
    if (input.mediaIds.length > 10) {
      throw new ApplicationError("VALIDATION_ERROR", "Cannot attach more than 10 media files to a single message");
    }
    const mediaIds: string[] = [];
    for (const id of input.mediaIds) {
      if (typeof id !== "string" || !id.trim()) {
        throw new ApplicationError("VALIDATION_ERROR", "Each mediaId must be a non-empty string");
      }
      mediaIds.push(id.trim());
    }
    return { messageType: "media", body, mediaIds, replyToId };
  }

  if (messageType === "location") {
    if (typeof input.location !== "object" || input.location === null) {
      throw new ApplicationError("VALIDATION_ERROR", "location object is required for location messages");
    }
    const loc = input.location as Record<string, unknown>;
    const latitude = Number(loc.latitude);
    const longitude = Number(loc.longitude);

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      throw new ApplicationError("VALIDATION_ERROR", "latitude must be a number between -90 and 90");
    }
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      throw new ApplicationError("VALIDATION_ERROR", "longitude must be a number between -180 and 180");
    }

    const validatedLocation: CreateLocationInput = {
      title: typeof loc.title === "string" ? loc.title.trim() : undefined,
      latitude,
      longitude,
      accuracyM: typeof loc.accuracyM === "number" ? loc.accuracyM : undefined,
      placeProvider: typeof loc.placeProvider === "string" ? loc.placeProvider.trim() : undefined,
      placeExternalId: typeof loc.placeExternalId === "string" ? loc.placeExternalId.trim() : undefined,
      addressLine: typeof loc.addressLine === "string" ? loc.addressLine.trim() : undefined,
      locality: typeof loc.locality === "string" ? loc.locality.trim() : undefined,
      region: typeof loc.region === "string" ? loc.region.trim() : undefined,
      countryCode: typeof loc.countryCode === "string" ? loc.countryCode.trim() : undefined,
      postalCode: typeof loc.postalCode === "string" ? loc.postalCode.trim() : undefined,
    };

    return { messageType: "location", body, location: validatedLocation, replyToId };
  }

  return { messageType, body, replyToId };
}

export function validateEditMessageInput(input: { body?: unknown }): {
  body: string;
} {
  if (typeof input.body !== "string" || !input.body.trim()) {
    throw new ApplicationError(
      "VALIDATION_ERROR",
      "Message body must be a non-empty string",
    );
  }

  const trimmedBody = input.body.trim();
  if (trimmedBody.length > 5000) {
    throw new ApplicationError(
      "VALIDATION_ERROR",
      "Message body cannot exceed 5000 characters",
    );
  }

  return { body: trimmedBody };
}
