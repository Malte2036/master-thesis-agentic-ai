/**
 * Utility functions for safely ingesting and normalizing RFC5545 RRULE strings.
 * Prevents infinite recurrences and auto-derives missing parameters.
 */

/**
 * Valid weekday abbreviations for RRULE BYDAY parameter.
 */
const VALID_WEEKDAYS = new Set(['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']);

/**
 * Mapping of common invalid day abbreviations to correct ones.
 */
const DAY_NORMALIZATION_MAP: Record<string, string> = {
  TW: 'TU', // Tuesday (common mistake)
  TUESDAY: 'TU',
  WEDNESDAY: 'WE',
  THURSDAY: 'TH',
  FRIDAY: 'FR',
  SATURDAY: 'SA',
  SUNDAY: 'SU',
  MONDAY: 'MO',
};

/**
 * Validates and normalizes BYDAY values in RRULE format.
 * Handles both simple day abbreviations (MO, TU) and ordinal day abbreviations (1MO, -1FR).
 * @param bydayValue - BYDAY value (e.g., "MO,WE" or "1MO,-1FR" or "TW,TH")
 * @returns Normalized BYDAY value with valid day abbreviations
 * @throws Error if invalid day abbreviations are found
 */
function normalizeBYDAY(bydayValue: string): string {
  const days = bydayValue.split(',');
  const normalizedDays: string[] = [];

  for (const day of days) {
    // Check if this is an ordinal day abbreviation (e.g., "1MO", "-1FR", "2TU")
    const ordinalMatch = day.match(/^([+-]?\d+)([A-Z]+)$/i);
    if (ordinalMatch) {
      const ordinal = ordinalMatch[1];
      const dayAbbr = ordinalMatch[2].toUpperCase();

      // Normalize common mistakes
      const normalizedDay = DAY_NORMALIZATION_MAP[dayAbbr] || dayAbbr;

      // Validate the day abbreviation
      if (!VALID_WEEKDAYS.has(normalizedDay)) {
        throw new Error(
          `Invalid day abbreviation in BYDAY: ${dayAbbr}. Valid values are: SU, MO, TU, WE, TH, FR, SA`,
        );
      }

      normalizedDays.push(`${ordinal}${normalizedDay}`);
    } else {
      // Simple day abbreviation (e.g., "MO", "TU", "TW")
      const normalizedDay =
        DAY_NORMALIZATION_MAP[day.toUpperCase()] || day.toUpperCase();

      if (!VALID_WEEKDAYS.has(normalizedDay)) {
        throw new Error(
          `Invalid day abbreviation in BYDAY: ${day}. Valid values are: SU, MO, TU, WE, TH, FR, SA`,
        );
      }

      normalizedDays.push(normalizedDay);
    }
  }

  return normalizedDays.join(',');
}

/**
 * Derives the weekday abbreviation (SU, MO, TU, WE, TH, FR, SA) from an ISO date string.
 * @param iso - ISO date string (e.g., "2025-10-22T13:00:00Z")
 * @returns Weekday abbreviation (e.g., "MO")
 * @throws Error if the date string is invalid
 */
export function weekdayFromISO(iso: string): string {
  // SU,MO,TU,WE,TH,FR,SA
  const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    throw new Error('Invalid event_start_date');
  }
  return days[d.getUTCDay()];
}

/**
 * Normalizes an RRULE string with safety validations:
 * - Enforces COUNT or UNTIL to prevent infinite recurrences
 * - Strips spaces and uppercases keys
 * - Auto-derives BYDAY for weekly recurrences when missing
 * - Returns a normalized RRULE string ready to be prefixed with "RRULE:"
 *
 * @param raw - Raw RRULE string (e.g., "FREQ=WEEKLY;BYDAY=MO,WE;COUNT=8")
 * @param opts - Optional parameters including event_start_date for BYDAY derivation
 * @returns Normalized RRULE string (e.g., "FREQ=WEEKLY;COUNT=8;BYDAY=MO,WE")
 * @throws Error if RRULE is invalid or missing required fields
 */
export function normalizeRRule(
  raw: string,
  opts?: { event_start_date?: string },
): string {
  if (!raw) {
    throw new Error('Empty RRULE');
  }

  // Strip spaces and normalize
  const cleaned = raw.replace(/\s+/g, '');
  const parts = cleaned.split(';').filter(Boolean);
  const kv = new Map<string, string>();

  for (const p of parts) {
    const [k, v] = p.split('=');
    if (!k || !v) {
      throw new Error(`Malformed RRULE part: ${p}`);
    }
    kv.set(k.toUpperCase(), v.toUpperCase());
  }

  // Required: FREQ
  if (!kv.has('FREQ')) {
    throw new Error('RRULE must include FREQ');
  }

  // Safety: require an end condition
  const hasEnd = kv.has('COUNT') || kv.has('UNTIL');
  if (!hasEnd) {
    throw new Error(
      'RRULE must include COUNT or UNTIL to avoid infinite recurrences',
    );
  }

  // Helpful: if WEEKLY without BYDAY, derive from start date (if available)
  if (
    kv.get('FREQ') === 'WEEKLY' &&
    !kv.has('BYDAY') &&
    opts?.event_start_date
  ) {
    kv.set('BYDAY', weekdayFromISO(opts.event_start_date));
  }

  // Validate and normalize BYDAY if present
  const bydayValue = kv.get('BYDAY');
  if (bydayValue) {
    try {
      const normalizedBYDAY = normalizeBYDAY(bydayValue);
      kv.set('BYDAY', normalizedBYDAY);
    } catch (error) {
      throw new Error(
        `Invalid BYDAY value: ${bydayValue}. ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // Rebuild in a stable, predictable order
  const order = [
    'FREQ',
    'INTERVAL',
    'COUNT',
    'UNTIL',
    'BYDAY',
    'BYMONTH',
    'BYMONTHDAY',
    'WKST',
  ];
  const out: string[] = [];
  for (const key of order) {
    if (kv.has(key)) {
      out.push(`${key}=${kv.get(key)}`);
    }
  }
  // Append any remaining keys not in the standard order
  for (const [k, v] of kv.entries()) {
    if (!order.includes(k)) {
      out.push(`${k}=${v}`);
    }
  }

  return out.join(';');
}
