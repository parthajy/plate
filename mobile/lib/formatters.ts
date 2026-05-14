import { format, isToday, isYesterday } from 'date-fns';

export function fmtKcal(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export function fmtGrams(n: number): string {
  const rounded = Math.round(n);
  return rounded.toString();
}

export function fmtDateLabel(d: Date): string {
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEE, MMM d');
}

export function fmtDateStamp(d: Date): string {
  return format(d, 'EEE · h:mm a').toUpperCase();
}

export function toIsoDate(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function startOfDayUtcIso(d: Date): string {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString();
}
