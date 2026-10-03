type LovableErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type LovableEvents = {
  track?: (event: string, properties?: Record<string, unknown>) => string | null;
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: LovableErrorOptions,
  ) => void;
};

declare global {
  interface Window {
    __lovableEvents?: LovableEvents;
    __lovableReportRuntimeError?: (payload: {
      message: string;
      stack?: string;
      filename?: string;
    }) => void;
  }
}

const TELEMETRY_TEXT_LIMIT = 2_000;
const TELEMETRY_STACK_LIMIT = 4_000;

function limitText(value: string, limit: number): string {
  return value.length > limit ? `${value.slice(0, limit)}…` : value;
}

function safePathname(): string {
  if (typeof window === "undefined") return "";
  return window.location.pathname;
}

function safeResponseLocation(error: Response): string | undefined {
  try {
    const url = new URL(error.url);
    return url.pathname || undefined;
  } catch {
    return undefined;
  }
}

export function reportLovableError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  const safeContext = Object.fromEntries(
    Object.entries(context).filter(
      ([key, value]) =>
        key !== "token" &&
        key !== "authorization" &&
        key !== "cookie" &&
        typeof value !== "function",
    ),
  );

  window.__lovableEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: safePathname(),
      ...safeContext,
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error",
    },
  );

  // Prod React does not rethrow boundary-caught errors to window.onerror, so the
  // editor's telemetry never sees them. Forward to lovable.js's reporting hook,
  // which is present only inside the editor preview.
  // Loaders and server fns commonly throw a raw Response; avoid sending query
  // strings or fragments from response URLs to the telemetry payload.
  const message =
    error instanceof Response
      ? `Response ${error.status}${safeResponseLocation(error) ? ` at ${safeResponseLocation(error)}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  window.__lovableReportRuntimeError?.({
    message: limitText(message, TELEMETRY_TEXT_LIMIT),
    ...(stack !== undefined && { stack: limitText(stack, TELEMETRY_STACK_LIMIT) }),
    filename: safePathname(),
  });
}
