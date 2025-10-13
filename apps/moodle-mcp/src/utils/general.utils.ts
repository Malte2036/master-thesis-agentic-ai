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
        displayValue = value.toString();
      } else {
        displayValue = `"${value}"`;
      }
      return `${key}: ${displayValue}`;
    })
    .join(', ');
};
