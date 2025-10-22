import { fromUnixTime, parseISO } from 'date-fns';

function isUnixTimestamp(value: string | number): boolean {
  return /^\d{10}$/.test(String(value)); // naive check: 10-digit seconds-based timestamp
}

export function parseTimestamp(value: string | number): Date {
  return typeof value === 'string' && !isUnixTimestamp(value)
    ? parseISO(value)
    : fromUnixTime(Number(value));
}

export function parseTimestampToISOString(value: string | number): string {
  return parseTimestamp(value).toISOString();
}

export function compareTimes(
  timestamp1: string | number,
  timestamp2: string | number,
): boolean {
  return (
    parseTimestamp(timestamp1).getTime() > parseTimestamp(timestamp2).getTime()
  );
}
