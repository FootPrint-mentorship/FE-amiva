"use client";

/**
 * Last-resort error boundary (replaces the root layout when a render crash
 * escapes everything else), so field crashes reach Sentry instead of
 * vanishing — exactly the class of bug the old Today-page crash was.
 * Renders its own <html>/<body> per the Next global-error contract; styles
 * are inline because the app's stylesheet may be part of what crashed.
 */
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F4F5FB",
          color: "#131628",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: "420px" }}>
          <h1 style={{ fontSize: "20px", fontWeight: 600, margin: 0 }}>
            Something went wrong on my side
          </h1>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#646880" }}>
            I&apos;ve noted it so it gets fixed. Nothing you did caused this,
            let&apos;s try again.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "16px",
              padding: "10px 22px",
              borderRadius: "10px",
              border: "none",
              background: "#20185B",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
          {/* When the app has crashed, reaching a human is the fallback that
              always works — a mailto carrying the error digest so support can
              tie the report to the Sentry event. */}
          <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#646880", marginTop: "20px" }}>
            Still stuck?{" "}
            <a
              href={`mailto:support@tryamiva.com?subject=${encodeURIComponent(
                "Amiva error report"
              )}&body=${encodeURIComponent(
                `Something went wrong while I was using Amiva.\n\nReference: ${
                  error.digest ?? "n/a"
                }`
              )}`}
              style={{ color: "#20185B", fontWeight: 600 }}
            >
              Email support
            </a>
          </p>
        </div>
      </body>
    </html>
  );
}
