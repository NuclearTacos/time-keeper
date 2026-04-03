export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Local midnight of a YYYY-MM-DD string as epoch ms */
export function startOfDay(dateStr: string): number {
  return new Date(dateStr + "T00:00:00").getTime();
}

/** Local end-of-day of a YYYY-MM-DD string as epoch ms */
export function endOfDay(dateStr: string): number {
  return new Date(dateStr + "T23:59:59.999").getTime();
}

/** Monday of the week containing `date`, at local midnight */
export function startOfWeek(date: Date): number {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon…
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
