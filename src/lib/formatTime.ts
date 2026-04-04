export function formatTime(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function epochMsToTimeString(epochMs: number): string {
  const d = new Date(epochMs);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function timeStringToEpochMs(timeStr: string, referenceDateEpochMs: number): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const d = new Date(referenceDateEpochMs);
  d.setHours(hours, minutes, 0, 0);
  return d.getTime();
}
