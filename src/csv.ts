export const escapeField = (value: string, delimiter: string): string =>
  value.includes(delimiter) || value.includes('"') ? `"${value.replaceAll('"', '""')}"` : value;
