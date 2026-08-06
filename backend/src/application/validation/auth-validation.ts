import { ApplicationError } from "../errors/application-error.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+[1-9]\d{1,14}$/;
const MIN_PASSWORD_LENGTH = 8;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone?: string): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;

  let cleaned = trimmed;
  if (trimmed.startsWith("00")) {
    cleaned = "+" + trimmed.slice(2).replace(/\D/g, "");
  } else if (!trimmed.startsWith("+")) {
    return null; // No fallback prefixing — must start with +
  } else {
    cleaned = "+" + trimmed.slice(1).replace(/\D/g, "");
  }

  if (PHONE_PATTERN.test(cleaned)) {
    return cleaned;
  }
  return null;
}

export function validateRegistrationInput(input: {
  email?: string;
  phone?: string;
  password: string;
}): { email: string | null; phoneE164: string | null; password: string } {
  const rawEmail = input.email?.trim();
  const rawPhone = input.phone?.trim();
  const password = input.password;

  if (!rawEmail && !rawPhone) {
    throw new ApplicationError(
      "VALIDATION_ERROR",
      "Either email or phone is required",
    );
  }

  let email: string | null = null;
  if (rawEmail) {
    const normalized = normalizeEmail(rawEmail);
    if (!EMAIL_PATTERN.test(normalized)) {
      throw new ApplicationError("VALIDATION_ERROR", "Invalid email format");
    }
    email = normalized;
  }

  let phoneE164: string | null = null;
  if (rawPhone) {
    phoneE164 = normalizePhone(rawPhone);
    if (!phoneE164) {
      throw new ApplicationError(
        "VALIDATION_ERROR",
        "Phone number must be in E.164 format starting with country code (e.g. +15551234567 or +923001234567)",
      );
    }
  }

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new ApplicationError(
      "VALIDATION_ERROR",
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
  }

  return {
    email,
    phoneE164,
    password,
  };
}

export function validateLoginIdentifier(input: {
  email?: string;
  phone?: string;
}): { email: string | null; phoneE164: string | null } {
  const email = input.email?.trim();
  const phone = input.phone?.trim();

  if (!email && !phone) {
    throw new ApplicationError(
      "VALIDATION_ERROR",
      "Either email or phone is required",
    );
  }

  if (email && phone) {
    throw new ApplicationError(
      "VALIDATION_ERROR",
      "Provide either email or phone, not both",
    );
  }

  return {
    email: email ? normalizeEmail(email) : null,
    phoneE164: phone ?? null,
  };
}
