export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION"
  | "RATE_LIMITED"
  | "CAPTCHA_FAILED"
  | "PII_DETECTED"
  | "BLOCKED"
  | "NOT_FOUND"
  | "INTERNAL";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ErrorCode; message: string; fields?: Record<string, string> };
