import { Alert, Button, clx } from "@medusajs/ui";
import type { ParsedApiError } from "../utils/api-error";
import { classifyErrorCode, parseApiError } from "../utils/api-error";

// ─── Types ───────────────────────────────────────────────────

export type ErrorBlockVariant = "inline" | "banner" | "page";

export interface ErrorBlockProps {
  /** The raw error (Error, response, or parsed object) */
  error: unknown;
  /** Optional override for the title shown above the message */
  title?: string;
  /** Visual variant */
  variant?: ErrorBlockVariant;
  /** Optional retry callback */
  onRetry?: () => void;
  /** Optional additional CSS classes */
  className?: string;
}

// ─── Component ───────────────────────────────────────────────

/**
 * Reusable error display block.
 *
 * Renders the backend error envelope in a consistent UI component.
 * Three variants:
 * - `inline` — Compact, sits within a card/section (default)
 * - `banner` — Full-width banner at the top of a page
 * - `page`   — Centred full-page error state
 *
 * @example
 * ```tsx
 * <ErrorBlock error={query.error} onRetry={() => query.refetch()} />
 * ```
 */
export function ErrorBlock({
  error,
  title,
  variant = "inline",
  onRetry,
  className,
}: ErrorBlockProps) {
  if (!error) return null;

  const parsed: ParsedApiError = parseApiError(error);
  const category = classifyErrorCode(parsed.code);
  const heading = title ?? getDefaultTitle(category);

  const containerClass = clx(
    variant === "inline" && "p-4 rounded-lg",
    variant === "banner" && "p-3",
    variant === "page" &&
      "flex flex-col items-center justify-center min-h-[300px] p-8 text-center",
    className,
  );

  if (variant === "page") {
    return (
      <div className={containerClass}>
        <span className="text-ui-fg-muted text-3xl mb-4">
          {getIcon(category)}
        </span>
        <div className="max-w-md">
          <Alert variant="error" className="mb-4">
            <span className="font-medium block mb-1">{heading}</span>
            <span className="text-ui-fg-subtle text-sm">{parsed.message}</span>
          </Alert>
          {parsed.details && (
            <pre className="text-left text-xs text-ui-fg-muted bg-ui-bg-subtle p-3 rounded-md overflow-auto max-h-32">
              {JSON.stringify(parsed.details, null, 2)}
            </pre>
          )}
          {onRetry && (
            <Button
              variant="secondary"
              size="small"
              onClick={onRetry}
              className="mt-4"
            >
              Try again
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass} role="alert">
      <Alert variant={getAlertVariant(category)} className="w-full">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className="font-medium block mb-0.5">{heading}</span>
            <span className="text-ui-fg-subtle text-sm block">
              {parsed.message}
            </span>
          </div>
          {onRetry && (
            <Button
              variant="secondary"
              size="small"
              onClick={onRetry}
              className="shrink-0"
            >
              Retry
            </Button>
          )}
        </div>
      </Alert>
    </div>
  );
}

/**
 * Per-field validation error message, designed to sit below form inputs.
 */
export interface FieldErrorProps {
  message?: string | null;
  className?: string;
}

export function FieldError({ message, className }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p className={clx("text-ui-fg-error text-xs mt-1", className)} role="alert">
      {message}
    </p>
  );
}

// ─── Internals ───────────────────────────────────────────────

function getDefaultTitle(category: string): string {
  switch (category) {
    case "VALIDATION":
      return "Validation error";
    case "AUTH":
      return "Access denied";
    case "NOT_FOUND":
      return "Not found";
    default:
      return "Something went wrong";
  }
}

function getIcon(category: string): string {
  switch (category) {
    case "VALIDATION":
      return "!";
    case "AUTH":
      return "\u{1F512}";
    case "NOT_FOUND":
      return "\u{1F50D}";
    default:
      return "\u26A0";
  }
}

function getAlertVariant(category: string): "error" | "warning" {
  return category === "VALIDATION" || category === "SERVER"
    ? "error"
    : "warning";
}
