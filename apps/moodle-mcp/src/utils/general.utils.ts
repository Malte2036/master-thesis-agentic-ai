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

const parsePossibleDate = (value: string | number): string | number => {
  if (typeof value !== 'number') {
    return value;
  }

  if (!/^\d{10}$/.test(String(value))) {
    return value;
  }

  return fromUnixTime(Number(value)).toString();
};

const fromUnixTime = (value: number): Date => {
  return new Date(value * 1000);
};
