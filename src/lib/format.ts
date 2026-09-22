/** Date/time display helpers (split out of the retired mock.ts). */

export function fmtTime(isoStr: string) {
  return new Date(isoStr).toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function fmtDay(isoStr: string) {
  const d = new Date(isoStr);
  const now = new Date();
  const diff = Math.floor(
    (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() -
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      86400000
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}
