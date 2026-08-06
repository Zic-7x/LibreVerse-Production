import type {
  AddCommunityMemberInput,
  CommunityMemberRole,
  CommunityVisibility,
  CreateCommunityInput,
  TransferOwnershipInput,
  UpdateCommunityInput,
  UpdateMemberRoleInput,
} from "@platform/shared-types";
import { ApplicationError } from "../errors/application-error.js";

const SLUG_REGEX = /^[a-z0-9-]{3,50}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateCreateCommunityInput(raw: unknown): CreateCommunityInput {
  if (!raw || typeof raw !== "object") {
    throw new ApplicationError("VALIDATION_ERROR", "Input must be an object");
  }

  const input = raw as Record<string, unknown>;

  if (typeof input.name !== "string" || input.name.trim().length < 1 || input.name.trim().length > 100) {
    throw new ApplicationError("VALIDATION_ERROR", "Community name must be between 1 and 100 characters");
  }

  if (typeof input.slug !== "string" || !SLUG_REGEX.test(input.slug.trim())) {
    throw new ApplicationError(
      "VALIDATION_ERROR",
      "Slug must be 3-50 characters containing lowercase letters, numbers, and hyphens",
    );
  }

  let description: string | undefined;
  if (input.description !== undefined && input.description !== null) {
    if (typeof input.description !== "string") {
      throw new ApplicationError("VALIDATION_ERROR", "Description must be a string");
    }
    description = input.description.trim();
  }

  let avatarMediaId: string | undefined;
  if (input.avatarMediaId !== undefined && input.avatarMediaId !== null) {
    if (typeof input.avatarMediaId !== "string" || !UUID_REGEX.test(input.avatarMediaId)) {
      throw new ApplicationError("VALIDATION_ERROR", "avatarMediaId must be a valid UUID");
    }
    avatarMediaId = input.avatarMediaId;
  }

  let visibility: CommunityVisibility = "public";
  if (input.visibility !== undefined && input.visibility !== null) {
    if (!["public", "private", "hidden"].includes(input.visibility as string)) {
      throw new ApplicationError("VALIDATION_ERROR", "visibility must be 'public', 'private', or 'hidden'");
    }
    visibility = input.visibility as CommunityVisibility;
  }

  return {
    name: input.name.trim(),
    slug: input.slug.trim().toLowerCase(),
    description,
    avatarMediaId,
    visibility,
  };
}

export function validateUpdateCommunityInput(raw: unknown): UpdateCommunityInput {
  if (!raw || typeof raw !== "object") {
    throw new ApplicationError("VALIDATION_ERROR", "Input must be an object");
  }

  const input = raw as Record<string, unknown>;
  const result: UpdateCommunityInput = {};

  if (input.name !== undefined) {
    if (typeof input.name !== "string" || input.name.trim().length < 1 || input.name.trim().length > 100) {
      throw new ApplicationError("VALIDATION_ERROR", "Community name must be between 1 and 100 characters");
    }
    result.name = input.name.trim();
  }

  if (input.slug !== undefined) {
    if (typeof input.slug !== "string" || !SLUG_REGEX.test(input.slug.trim())) {
      throw new ApplicationError(
        "VALIDATION_ERROR",
        "Slug must be 3-50 characters containing lowercase letters, numbers, and hyphens",
      );
    }
    result.slug = input.slug.trim().toLowerCase();
  }

  if (input.description !== undefined) {
    if (input.description === null) {
      result.description = null;
    } else if (typeof input.description === "string") {
      result.description = input.description.trim();
    } else {
      throw new ApplicationError("VALIDATION_ERROR", "Description must be a string or null");
    }
  }

  if (input.avatarMediaId !== undefined) {
    if (input.avatarMediaId === null) {
      result.avatarMediaId = null;
    } else if (typeof input.avatarMediaId === "string" && UUID_REGEX.test(input.avatarMediaId)) {
      result.avatarMediaId = input.avatarMediaId;
    } else {
      throw new ApplicationError("VALIDATION_ERROR", "avatarMediaId must be a valid UUID or null");
    }
  }

  if (input.visibility !== undefined) {
    if (!["public", "private", "hidden"].includes(input.visibility as string)) {
      throw new ApplicationError("VALIDATION_ERROR", "visibility must be 'public', 'private', or 'hidden'");
    }
    result.visibility = input.visibility as CommunityVisibility;
  }

  return result;
}

export function validateUpdateMemberRoleInput(raw: unknown): UpdateMemberRoleInput {
  if (!raw || typeof raw !== "object") {
    throw new ApplicationError("VALIDATION_ERROR", "Input must be an object");
  }

  const input = raw as Record<string, unknown>;

  if (!input.role || !["owner", "admin", "moderator", "member"].includes(input.role as string)) {
    throw new ApplicationError("VALIDATION_ERROR", "role must be 'admin', 'moderator', or 'member'");
  }

  return {
    role: input.role as CommunityMemberRole,
  };
}

export function validateTransferOwnershipInput(raw: unknown): TransferOwnershipInput {
  if (!raw || typeof raw !== "object") {
    throw new ApplicationError("VALIDATION_ERROR", "Input must be an object");
  }

  const input = raw as Record<string, unknown>;

  if (typeof input.newOwnerUserId !== "string" || !UUID_REGEX.test(input.newOwnerUserId)) {
    throw new ApplicationError("VALIDATION_ERROR", "newOwnerUserId must be a valid UUID");
  }

  return {
    newOwnerUserId: input.newOwnerUserId,
  };
}

export function validateAddMemberInput(raw: unknown): AddCommunityMemberInput {
  if (!raw || typeof raw !== "object") {
    throw new ApplicationError("VALIDATION_ERROR", "Input must be an object");
  }

  const input = raw as Record<string, unknown>;

  if (typeof input.userId !== "string" || !UUID_REGEX.test(input.userId)) {
    throw new ApplicationError("VALIDATION_ERROR", "userId must be a valid UUID");
  }

  let role: CommunityMemberRole | undefined;
  if (input.role !== undefined) {
    if (!["admin", "moderator", "member"].includes(input.role as string)) {
      throw new ApplicationError("VALIDATION_ERROR", "role must be 'admin', 'moderator', or 'member'");
    }
    role = input.role as CommunityMemberRole;
  }

  return {
    userId: input.userId,
    role,
  };
}
