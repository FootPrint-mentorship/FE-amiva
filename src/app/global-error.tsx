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
        </div>
      </body>
    </html>
  );
}
