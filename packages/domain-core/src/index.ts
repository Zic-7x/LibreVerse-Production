/**
 * Placeholder for shared domain logic used by multiple surfaces (M0 wiring only).
 */
export function isNonEmptyString(value: string): boolean {
  return value.trim().length > 0;
}
