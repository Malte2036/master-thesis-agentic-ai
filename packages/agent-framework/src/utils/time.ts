import { fromUnixTime, parseISO } from 'date-fns';

export function getCurrentTimestamp(): Date {
  if (process.env['EVAL_FREEZE_DATE']) {
    return parseISO(process.env['EVAL_FREEZE_DATE']);
  }
  return new Date();
}

function isUnixTimestamp(value: string | number): boolean {
  return /^\d{10}$/.test(String(value)); // naive check: 10-digit seconds-based timestamp
}

export function parseTimestamp(value: string | number): Date {
  if (typeof value === 'string' && !isUnixTimestamp(value)) {
    // Check for format: "YYYY-MM-DD HH:MM:SS UTC"
    const utcFormatMatch = value.match(
      /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+UTC$/,
    );
    if (utcFormatMatch) {
      // Parse as UTC by replacing space with 'T' and adding 'Z' for ISO format
      const isoString = utcFormatMatch[1].replace(' ', 'T') + 'Z';
      return new Date(isoString);
    }
    return parseISO(value);
  }
  return fromUnixTime(Number(value));
}

export function parseTimestampToISOString(value: string | number): string {
  return parseTimestamp(value).toISOString();
}

export function compareTimes(
  timestamp1: string | number | undefined,
  timestamp2: string | number | undefined,
): boolean {
  if (!timestamp1 || !timestamp2) {
    return false;
  }
  return (
    parseTimestamp(timestamp1).getTime() > parseTimestamp(timestamp2).getTime()
  );
}
