const needsQuoting = (value: string, delimiter: string): boolean =>
  [delimiter, '"', "\n", "\r"].some((char) => value.includes(char));

export const neutralizeFormula = (value: string): string =>
  value.startsWith("=") ? `'${value}` : value;

export const escapeField = (value: string, delimiter: string): string =>
  needsQuoting(value, delimiter) ? `"${value.replaceAll('"', '""')}"` : value;
