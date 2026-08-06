import { ApplicationError } from "../errors/application-error.js";

export const ALIAS_PATTERN = /^[a-z0-9_]{3,30}$/;

export function normalizeAlias(alias: string): string {
  return alias.trim().toLowerCase();
}

export function validateAliasInput(rawAlias: string): string {
  if (typeof rawAlias !== "string") {
    throw new ApplicationError("VALIDATION_ERROR", "Alias must be a string");
  }

  const alias = normalizeAlias(rawAlias);

  if (!ALIAS_PATTERN.test(alias)) {
    throw new ApplicationError(
      "VALIDATION_ERROR",
      "Alias must be 3-30 characters containing only lowercase letters, numbers, and underscores",
    );
  }

  return alias;
}

export function validateUpdateProfileInput(input: {
  displayName?: string;
  bio?: string | null;
  avatarMediaId?: string | null;
  birthDate?: string | null;
  locale?: string;
  timezone?: string;
  isDiscoverable?: boolean;
}): {
  displayName?: string;
  bio?: string | null;
  avatarMediaId?: string | null;
  birthDate?: string | null;
  locale?: string;
  timezone?: string;
  isDiscoverable?: boolean;
} {
  const result: ReturnType<typeof validateUpdateProfileInput> = {};

  if (input.avatarMediaId !== undefined) {
    if (input.avatarMediaId === null) {
      result.avatarMediaId = null;
    } else if (
      typeof input.avatarMediaId !== "string" ||
      !input.avatarMediaId.trim()
    ) {
      throw new ApplicationError("VALIDATION_ERROR", "avatarMediaId must be a valid string or null");
    } else {
      result.avatarMediaId = input.avatarMediaId.trim();
    }
  }

  if (input.displayName !== undefined) {
    const trimmed = input.displayName.trim();
    if (trimmed.length < 1 || trimmed.length > 80) {
      throw new ApplicationError(
        "VALIDATION_ERROR",
        "Display name must be between 1 and 80 characters",
      );
    }
    result.displayName = trimmed;
  }

  if (input.bio !== undefined) {
    if (input.bio === null) {
      result.bio = null;
    } else {
      const trimmed = input.bio.trim();
      if (trimmed.length > 500) {
        throw new ApplicationError(
          "VALIDATION_ERROR",
          "Bio must not exceed 500 characters",
        );
      }
      result.bio = trimmed;
    }
  }

  if (input.birthDate !== undefined) {
    if (input.birthDate === null) {
      result.birthDate = null;
    } else {
      const dateStr = input.birthDate.trim();
      if (isNaN(Date.parse(dateStr))) {
        throw new ApplicationError(
          "VALIDATION_ERROR",
          "Birth date must be a valid date string",
        );
      }
      result.birthDate = dateStr;
    }
  }

  if (input.locale !== undefined) {
    const trimmed = input.locale.trim();
    if (!trimmed) {
      throw new ApplicationError("VALIDATION_ERROR", "Locale cannot be empty");
    }
    result.locale = trimmed;
  }

  if (input.timezone !== undefined) {
    const trimmed = input.timezone.trim();
    if (!trimmed) {
      throw new ApplicationError("VALIDATION_ERROR", "Timezone cannot be empty");
    }
    result.timezone = trimmed;
  }

  if (input.isDiscoverable !== undefined) {
    if (typeof input.isDiscoverable !== "boolean") {
      throw new ApplicationError("VALIDATION_ERROR", "isDiscoverable must be a boolean");
    }
    result.isDiscoverable = input.isDiscoverable;
  }

  return result;
}
