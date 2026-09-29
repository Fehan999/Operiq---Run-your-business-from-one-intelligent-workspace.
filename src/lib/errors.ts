import { z } from "zod";

export type AppErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "LIMIT_REACHED"
  | "UNAVAILABLE"
  | "INTERNAL";

const DEFAULT_MESSAGES: Record<AppErrorCode, string> = {
  UNAUTHENTICATED: "Please sign in to continue.",
  FORBIDDEN: "You don't have permission to do that.",
  NOT_FOUND: "We couldn't find what you were looking for.",
  VALIDATION: "Some of the details need another look.",
  CONFLICT: "That conflicts with existing data.",
  RATE_LIMITED: "Too many attempts. Please wait a moment and try again.",
  LIMIT_REACHED: "Your current plan limit has been reached.",
  UNAVAILABLE: "This feature is not available right now.",
  INTERNAL: "Something went wrong on our side. Please try again.",
};

/**
 * Errors that are safe to show to the user. Anything else that bubbles up is logged and
 * replaced with a generic message so internals never leak into the UI.
 */
export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    code: AppErrorCode,
    message?: string,
    options?: { fieldErrors?: Record<string, string[]>; cause?: unknown },
  ) {
    super(message ?? DEFAULT_MESSAGES[code], { cause: options?.cause });
    this.name = "AppError";
    this.code = code;
    this.fieldErrors = options?.fieldErrors;
  }
}

export const isAppError = (error: unknown): error is AppError => error instanceof AppError;

export type ActionSuccess<T> = { ok: true; data: T; message?: string };
export type ActionFailure = {
  ok: false;
  code: AppErrorCode;
  error: string;
  fieldErrors?: Record<string, string[]>;
};
export type ActionResult<T = null> = ActionSuccess<T> | ActionFailure;

export function zodFieldErrors(error: z.ZodError): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_form";
    (result[key] ??= []).push(issue.message);
  }
  return result;
}

export function toActionFailure(error: unknown): ActionFailure {
  if (error instanceof AppError) {
    return { ok: false, code: error.code, error: error.message, fieldErrors: error.fieldErrors };
  }
  if (error instanceof z.ZodError) {
    return {
      ok: false,
      code: "VALIDATION",
      error: DEFAULT_MESSAGES.VALIDATION,
      fieldErrors: zodFieldErrors(error),
    };
  }
  return { ok: false, code: "INTERNAL", error: DEFAULT_MESSAGES.INTERNAL };
}
