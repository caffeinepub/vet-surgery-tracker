import type { SurgeryCase } from '../../../backend';

/**
 * Returns an array of 7 Date objects (Sun–Sat) for the week offset from today.
 * weekOffset=0 → current week, weekOffset=-1 → last week, etc.
 */
export function getWeekDays(weekOffset: number): Date[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 6=Sat
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek + weekOffset * 7);
  sunday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

/** Returns true if two Date objects represent the same calendar day. */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/** Converts a bigint nanosecond timestamp to a Date. */
export function bigintToDate(time: bigint): Date {
  return new Date(Number(time) / 1_000_000);
}

/** Filters cases whose arrivalDate falls on the given targetDate. */
export function filterCasesByDay(cases: SurgeryCase[], targetDate: Date): SurgeryCase[] {
  return cases.filter((c) => {
    const arrival = bigintToDate(c.arrivalDate);
    return isSameDay(arrival, targetDate);
  });
}

/** Formats a week range like "Feb 23 – Mar 1, 2026". */
export function formatWeekRange(startDate: Date, endDate: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const start = startDate.toLocaleDateString('en-US', opts);
  const end = endDate.toLocaleDateString('en-US', { ...opts, year: 'numeric' });
  return `${start} – ${end}`;
}

/** Returns true if today falls within the given week days array. */
export function isCurrentWeek(weekDays: Date[]): boolean {
  const today = new Date();
  return weekDays.some((d) => isSameDay(d, today));
}
