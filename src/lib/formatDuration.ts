/**
 * Formats a duration in milliseconds to a human-readable string.
 * By default seconds are omitted; pass showSeconds=true to include them.
 * Example: 5025000 → "1h 23m" (default) or "1h 23m 45s" (showSeconds)
 */
export function formatDuration(ms: number, showSeconds = false): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0) parts.push(`${m}m`);
  if (showSeconds) parts.push(`${s}s`);
  if (parts.length === 0) return showSeconds ? `${s}s` : "0m";
  return parts.join(" ");
}
