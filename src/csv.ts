const needsQuoting = (value: string, delimiter: string): boolean =>
  [delimiter, '"', "\n", "\r"].some((char) => value.includes(char));

// Tecken som får en kalkylator att tolka ett fält som formel (B6, OWASP).
// Sist i listan: fullbreddsvarianterna av =, +, - och @.
const formulaTriggers = ["=", "+", "-", "@", "\t", "\r", "\n", "＝", "＋", "－", "＠"];

export const neutralizeFormula = (value: string): string =>
  formulaTriggers.some((char) => value.startsWith(char)) ? `'${value}` : value;

export const escapeField = (value: string, delimiter: string): string =>
  needsQuoting(value, delimiter) ? `"${value.replaceAll('"', '""')}"` : value;
