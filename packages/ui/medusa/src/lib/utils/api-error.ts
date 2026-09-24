/**
 * API Error parsing utilities.
 *
 * The backend always returns errors in the consistent envelope:
 *   { success: false, error: { code, message, details? } }
 *
 * These helpers extract structured information from any error shape
 * thrown by the Medusa JS SDK, fetch, or React Query.
 */

// ─── Types ───────────────────────────────────────────────────

export interface ParsedApiError {
  /** Machine-readable error code (e.g. "VALIDATION_ERROR", "NOT_FOUND") */
  code: string
  /** Human-readable description */
  message: string
  /** Optional structured details (validation errors, field info, etc.) */
  details?: Record<string, unknown>
  /** HTTP status if available */
  status?: number
}

// ─── Helpers ─────────────────────────────────────────────────

/** CSS colour tokens keyed by error family, for UI components. */
export const ERROR_UI: Record<string, { color: "red" | "orange" | "yellow"; icon: string }> = {
  VALIDATION: { color: "red", icon: "✗" },
  AUTH: { color: "orange", icon: "🔒" },
  NOT_FOUND: { color: "yellow", icon: "🔍" },
  SERVER: { color: "red", icon: "⚠" },
}

export function classifyErrorCode(code: string): "VALIDATION" | "AUTH" | "NOT_FOUND" | "SERVER" {
  if (code.endsWith("VALIDATION_ERROR") || code === "INVALID_DATA") return "VALIDATION"
  if (code === "UNAUTHENTICATED" || code === "FORBIDDEN") return "AUTH"
  if (code === "NOT_FOUND") return "NOT_FOUND"
  return "SERVER"
}

/**
 * Parse any thrown value into a structured ParsedApiError.
 *
 * Handles:
 * - MedusaError (from @medusajs/js-sdk) — { message, type, status }
 * - Our backend envelope — { error: { code, message, details } }
 * - Standard Error — message only
 * - Plain strings / unknown
 */
export function parseApiError(error: unknown): ParsedApiError {
  if (!error) {
    return { code: "UNKNOWN", message: "An unexpected error occurred" }
  }

  // Medusa JS SDK throws errors shaped like { message, type, status, ... }
  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>

    // Backend envelope: { success: false, error: { code, message, details? } }
    if (obj?.error && typeof obj.error === "object") {
      const err = obj.error as Record<string, unknown>
      return {
        code: (err.code as string) ?? "UNKNOWN",
        message: (err.message as string) ?? "Unknown error",
        details: err.details as Record<string, unknown> | undefined,
        status: obj.status as number | undefined,
      }
    }

    // MedusaError shape: { type, message, status }
    if (obj.type && typeof obj.type === "string") {
      return {
        code: obj.type,
        message: (obj.message as string) ?? obj.type,
        status: obj.status as number | undefined,
        details: obj.details as Record<string, unknown> | undefined,
      }
    }
  }

  // Standard Error
  if (error instanceof Error) {
    return { code: "UNKNOWN", message: error.message }
  }

  // String
  if (typeof error === "string") {
    return { code: "UNKNOWN", message: error }
  }

  return { code: "UNKNOWN", message: "An unexpected error occurred" }
}

/**
 * Shortcut to get a user-friendly message from an error.
 * Falls back to a generic message if nothing usable is found.
 */
export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  return parseApiError(error).message || fallback
}

/**
 * Check whether an error has a specific code.
 * Useful for conditional UI (e.g. "show a different message for 404s").
 */
export function isErrorCode(error: unknown, code: string): boolean {
  return parseApiError(error).code === code
}

/**
 * Extract validation field errors from the details payload.
 * The backend sends validation errors as:
 *   details: { errors: [{ field, message }] }
 *
 * Returns a map keyed by field path for easy lookup in forms.
 */
export function getFieldErrors(error: unknown): Record<string, string> {
  const parsed = parseApiError(error)
  const details = parsed.details
  if (!details) return {}

  // Direct array of field errors
  const errors = details.errors as
    Array<{ field?: string; message?: string; path?: string }> | undefined
  if (Array.isArray(errors)) {
    return Object.fromEntries(
      errors
        .filter((e) => e.field || e.path)
        .map((e) => [(e.field ?? e.path)!, e.message ?? "Invalid value"]),
    )
  }

  // Zod issues nested under details.errors[].issues
  const issues = details.issues as Array<{ path: (string | number)[]; message: string }> | undefined
  if (Array.isArray(issues)) {
    return Object.fromEntries(issues.map((i) => [i.path.join("."), i.message]))
  }

  return {}
}
