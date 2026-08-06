export type ApplicationErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_CREDENTIALS"
  | "CONFLICT"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "TOO_MANY_REQUESTS"
  | "STORAGE_UNAVAILABLE";

export class ApplicationError extends Error {
  constructor(
    public readonly code: ApplicationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}
