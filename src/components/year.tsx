"use client";

/**
 * Always-current copyright year. Client-rendered so statically generated
 * pages show the visitor's current year, not the year of the last build;
 * suppressHydrationWarning covers the build-year → current-year swap.
 */
export function Year() {
  return <span suppressHydrationWarning>{new Date().getFullYear()}</span>;
}
