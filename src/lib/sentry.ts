// Lightweight Sentry client wrapper
// Only initializes when NEXT_PUBLIC_SENTRY_DSN is set

let initialized = false;

export async function initSentry() {
  if (initialized || typeof window === "undefined" || !process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  initialized = true;

  const { init } = await import("@sentry/browser");
  init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV ?? "production",
    release: process.env.NEXT_PUBLIC_APP_VERSION,
  });
}

export async function captureError(err: unknown, context?: Record<string, string>) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  try {
    const { captureException, withScope } = await import("@sentry/browser");
    if (context) {
      withScope((scope) => {
        Object.entries(context).forEach(([k, v]) => scope.setTag(k, v));
        captureException(err);
      });
    } else {
      captureException(err);
    }
  } catch {
    // Never block on Sentry failure
  }
}
