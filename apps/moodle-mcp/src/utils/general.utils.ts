// Table serializer types
type ColumnSpec<T> = {
  /** Property path on the row object (dot notation allowed), e.g. "course.id" */
  key: string;
  /** Optional header label; defaults to `key` */
  header?: string;
  /** Transform raw value -> string */
  transform?: (value: unknown, row: T) => string;
  /** Truncate to N visible chars (adds …) */
  maxLen?: number;
};

// Zod schema to column spec mapping
type ZodToColumnOptions = {
  /** Custom header mappings for specific fields */
  headerMap?: Record<string, string>;
  /** Custom transforms for specific fields */
  transforms?: Record<string, (value: unknown) => string>;
  /** Custom max length for specific fields */
  maxLengths?: Record<string, number>;
  /** Fields to exclude from the table */
  exclude?: string[];
};

type SerializeOptions = {
  delimiter?: string; // default: " | "
  quoteMode?: 'auto' | 'always' | 'never'; // default: "auto"
  nullAs?: string; // default: ""
  includeObservation?: boolean; // default: true
  observation?: Record<string, string | number | boolean>;
};

// Main table serializer function
export function serializeTable<T>(
  rows: T[],
  columns: ColumnSpec<T>[],
  opts: SerializeOptions = {},
): string {
  const delimiter = opts.delimiter ?? ' | ';
  const quoteMode = opts.quoteMode ?? 'auto';
  const nullAs = opts.nullAs ?? '';

  const headers = columns.map((c) => c.header ?? c.key);

  const lines: string[] = [];

  // Optional OBSERVATION header
  if (opts.includeObservation ?? true) {
    const obs = opts.observation ?? {};
    const obsPairs = Object.entries(obs).map(
      ([k, v]) => `${k}=${formatScalar(v)}`,
    );
    lines.push('OBSERVATION');
    if (obsPairs.length) lines.push(obsPairs.join(' '));
    lines.push(''); // blank line
  }

  // FIELDS
  lines.push('FIELDS');
  lines.push(headers.join(delimiter));
  lines.push(''); // blank line

  // ROWS
  lines.push('ROWS');
  for (const row of rows) {
    const cells = columns.map((col) => {
      const raw = getByPath(row as Record<string, unknown>, col.key);
      let text = col.transform
        ? col.transform(raw, row)
        : formatCell(raw, { nullAs });

      if (col.maxLen && text.length > col.maxLen) {
        text = text.slice(0, Math.max(0, col.maxLen - 1)) + '…';
      }
      return quoteIfNeeded(text, delimiter.trim(), quoteMode);
    });

    lines.push(cells.join(delimiter));
  }

  return lines.join('\n');
}

// Helper functions
function getByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key: string) => {
    if (acc == null || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

function formatScalar(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return JSON.stringify(v);
}

function formatCell(v: unknown, { nullAs }: { nullAs: string }): string {
  if (v === null || v === undefined) return nullAs;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  // Fallback to JSON for objects/arrays
  return JSON.stringify(v);
}

function needsQuoting(text: string, delimChar: string): boolean {
  // Quote if contains delimiter, space, tab, newline, or quotes
  return /[\s"|]|[\r\n]/.test(text) || text.includes(delimChar);
}

function quoteIfNeeded(
  text: string,
  delimChar: string,
  mode: 'auto' | 'always' | 'never',
): string {
  if (mode === 'never') return text;
  if (mode === 'always' || needsQuoting(text, delimChar)) {
    // escape internal quotes
    const escaped = text.replace(/"/g, '\\"');
    return `"${escaped}"`;
  }
  return text;
}

// Timezone-aware date formatting for Moodle timestamps
function toDateString(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toString();
}

// Generate column specifications from Zod schema
export function generateColumnsFromZod<T>(
  schema: unknown, // Zod schema
  options: ZodToColumnOptions = {},
): ColumnSpec<T>[] {
  const {
    headerMap = {},
    transforms = {},
    maxLengths = {},
    exclude = [],
  } = options;

  // Default transforms for common field types
  const defaultTransforms: Record<string, (value: unknown) => string> = {
    // Date fields (Unix timestamps)
    duedate: (value) => {
      if (typeof value === 'number' && value > 0) {
        return new Date(value * 1000)
          .toISOString()
          .replace('T', ' ')
          .split('.')[0];
      }
      return 'No due date';
    },
    allowsubmissionsfromdate: (value) => {
      if (typeof value === 'number' && value > 0) {
        return new Date(value * 1000)
          .toISOString()
          .replace('T', ' ')
          .split('.')[0];
      }
      return 'Not set';
    },
    startdate: (value) => {
      if (typeof value === 'number' && value > 0) {
        return new Date(value * 1000).toISOString().split('T')[0];
      }
      return '';
    },
    enddate: (value) => {
      if (typeof value === 'number' && value > 0) {
        return new Date(value * 1000).toISOString().split('T')[0];
      }
      return '';
    },
    firstaccess: (value) => {
      if (typeof value === 'number' && value > 0) {
        return new Date(value * 1000)
          .toISOString()
          .replace('T', ' ')
          .split('.')[0];
      }
      return 'Never';
    },
    lastaccess: (value) => {
      if (typeof value === 'number' && value > 0) {
        return new Date(value * 1000)
          .toISOString()
          .replace('T', ' ')
          .split('.')[0];
      }
      return 'Never';
    },
    // Boolean fields
    visible: (value) => (value ? 'Yes' : 'No'),
    completed: (value) => (value ? 'Yes' : 'No'),
    isfavourite: (value) => (value ? 'Yes' : 'No'),
    hidden: (value) => (value ? 'Yes' : 'No'),
    completionsubmit: (value) => (value ? 'Yes' : 'No'),
    // Default string truncation for long fields
    summary: (value) => {
      if (typeof value === 'string') {
        return value.length > 100 ? value.slice(0, 97) + '...' : value;
      }
      return String(value || '');
    },
    intro: (value) => {
      if (typeof value === 'string') {
        return value.length > 100 ? value.slice(0, 97) + '...' : value;
      }
      return String(value || '');
    },
  };

  // Default max lengths for common fields
  const defaultMaxLengths: Record<string, number> = {
    fullname: 60,
    name: 80,
    summary: 150,
    intro: 150,
    email: 50,
    username: 30,
    firstname: 30,
    lastname: 30,
    shortname: 20,
    modname: 20,
    type: 20,
    url: 120,
  };

  // Default header mappings
  const defaultHeaderMap: Record<string, string> = {
    id: 'ID',
    userid: 'User ID',
    course: 'Course ID',
    fullname: 'Name',
    name: 'Name',
    shortname: 'Short Name',
    summary: 'Summary',
    startdate: 'Start Date',
    enddate: 'End Date',
    duedate: 'Due Date',
    allowsubmissionsfromdate: 'Open From',
    grade: 'Max Grade',
    completionsubmit: 'Submit to Complete',
    visible: 'Visible',
    completed: 'Completed',
    isfavourite: 'Favourite',
    hidden: 'Hidden',
    firstaccess: 'First Access',
    lastaccess: 'Last Access',
    username: 'Username',
    firstname: 'First Name',
    lastname: 'Last Name',
    email: 'Email',
    modname: 'Module',
    url: 'URL',
  };

  // Extract field names and descriptions from Zod schema
  const fieldNames = extractFieldNamesFromZod(schema);
  const fieldDescriptions = extractFieldDescriptionsFromZod(schema);

  return fieldNames
    .filter((field) => !exclude.includes(field))
    .map((field) => ({
      key: field,
      header:
        headerMap[field] ||
        fieldDescriptions[field] ||
        defaultHeaderMap[field] ||
        field,
      transform: transforms[field] || defaultTransforms[field] || undefined,
      maxLen: maxLengths[field] || defaultMaxLengths[field] || undefined,
    }));
}

// Helper function to extract field names and descriptions from Zod schema
function extractFieldNamesFromZod(schema: unknown): string[] {
  if (!schema || typeof schema !== 'object' || !('_def' in schema)) return [];

  const def = (schema as { _def: unknown })._def;

  // Handle object schemas
  if (
    typeof def === 'object' &&
    def &&
    'typeName' in def &&
    def.typeName === 'ZodObject'
  ) {
    const zodDef = def as unknown as { shape: () => Record<string, unknown> };
    if ('shape' in zodDef && typeof zodDef.shape === 'function') {
      const shape = zodDef.shape();
      return Object.keys(shape);
    }
  }

  // Handle array schemas
  if (
    typeof def === 'object' &&
    def &&
    'typeName' in def &&
    def.typeName === 'ZodArray'
  ) {
    const zodDef = def as unknown as { type: unknown };
    if ('type' in zodDef) {
      return extractFieldNamesFromZod(zodDef.type);
    }
  }

  // Handle lazy schemas
  if (
    typeof def === 'object' &&
    def &&
    'typeName' in def &&
    def.typeName === 'ZodLazy'
  ) {
    const zodDef = def as unknown as { getter: () => unknown };
    if ('getter' in zodDef && typeof zodDef.getter === 'function') {
      return extractFieldNamesFromZod(zodDef.getter());
    }
  }

  return [];
}

// Helper function to extract field descriptions from Zod schema
function extractFieldDescriptionsFromZod(
  schema: unknown,
): Record<string, string> {
  if (!schema || typeof schema !== 'object' || !('_def' in schema)) return {};

  const def = (schema as { _def: unknown })._def;

  // Handle object schemas
  if (
    typeof def === 'object' &&
    def &&
    'typeName' in def &&
    def.typeName === 'ZodObject'
  ) {
    const zodDef = def as unknown as { shape: () => Record<string, unknown> };
    if ('shape' in zodDef && typeof zodDef.shape === 'function') {
      const shape = zodDef.shape();
      const descriptions: Record<string, string> = {};

      Object.entries(shape).forEach(([key, fieldSchema]) => {
        if (
          fieldSchema &&
          typeof fieldSchema === 'object' &&
          '_def' in fieldSchema
        ) {
          const fieldDef = (fieldSchema as { _def: { description?: string } })
            ._def;
          if (fieldDef && fieldDef.description) {
            descriptions[key] = fieldDef.description;
          }
        }
      });

      return descriptions;
    }
  }

  // Handle array schemas
  if (
    typeof def === 'object' &&
    def &&
    'typeName' in def &&
    def.typeName === 'ZodArray'
  ) {
    const zodDef = def as unknown as { type: unknown };
    if ('type' in zodDef) {
      return extractFieldDescriptionsFromZod(zodDef.type);
    }
  }

  // Handle lazy schemas
  if (
    typeof def === 'object' &&
    def &&
    'typeName' in def &&
    def.typeName === 'ZodLazy'
  ) {
    const zodDef = def as unknown as { getter: () => unknown };
    if ('getter' in zodDef && typeof zodDef.getter === 'function') {
      return extractFieldDescriptionsFromZod(zodDef.getter());
    }
  }

  return {};
}

// Legacy function for backward compatibility
export const objectToHumanReadableString = <T extends object>(
  obj: T,
): string => {
  return Object.entries(obj)
    .filter(
      ([, value]) =>
        value !== null &&
        value !== undefined &&
        value !== '' &&
        !(Array.isArray(value) && value.length === 0),
    )
    .map(([key, value]) => {
      let displayValue;
      if (Array.isArray(value)) {
        displayValue = `[${value
          .map((item) =>
            typeof item === 'object' ? JSON.stringify(item) : item,
          )
          .join(', ')}]`;
      } else if (typeof value === 'object' && value !== null) {
        displayValue = JSON.stringify(value);
      } else if (typeof value === 'number') {
        displayValue = parsePossibleDate(value);
      } else {
        displayValue = `"${value}"`;
      }
      return `${key}: ${displayValue}`;
    })
    .join(', ');
};

// Updated function using the new table serializer
export const objectsToHumanReadableString = <T extends object>(
  objs: T[],
  options?: {
    columns?: ColumnSpec<T>[];
    serializeOptions?: SerializeOptions;
  },
): string => {
  if (!objs || objs.length === 0) {
    return 'No data available';
  }

  // If no columns specified, auto-generate from first object
  const columns =
    options?.columns ||
    Object.keys(objs[0] as Record<string, unknown>).map((key) => ({
      key,
      header: key,
      transform: (value: unknown) => {
        if (typeof value === 'number' && /^\d{10}$/.test(String(value))) {
          return toDateString(value);
        }
        return formatCell(value, { nullAs: '' });
      },
    }));

  return serializeTable(objs, columns, {
    observation: {
      source: 'moodle_api',
      total_items: objs.length,
      generated_at: new Date().toISOString(),
    },
    ...options?.serializeOptions,
  });
};

const parsePossibleDate = (value: string | number): string | number => {
  if (typeof value !== 'number') {
    return value;
  }

  if (!/^\d{10}$/.test(String(value))) {
    return value;
  }

  return fromUnixTime(Number(value)).toString();
};

const fromUnixTime = (value: number): string => {
  const date = new Date(value * 1000);
  return date.toISOString();
};
