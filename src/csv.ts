const needsQuoting = (value: string, delimiter: string): boolean =>
  [delimiter, '"', "\n", "\r"].some((char) => value.includes(char));

export const escapeField = (value: string, delimiter: string): string =>
  needsQuoting(value, delimiter) ? `"${value.replaceAll('"', '""')}"` : value;
