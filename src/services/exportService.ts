import { ExportLang, exportStrings } from "../i18n/exportStrings";
import { Result, err, ok } from "../result";

const BOM = "\uFEFF";

export type OrderExport = { filename: string; csv: string };

export async function exportOrders(lang?: unknown): Promise<Result<OrderExport>> {
  const requested = lang === undefined ? "sv" : typeof lang === "string" && lang.toLowerCase();
  if (requested !== "sv" && requested !== "en") {
    return err("invalid_input", "lang måste vara sv eller en.");
  }
  const language: ExportLang = requested;
  const strings = exportStrings[language];
  const { order, date, status, product, quantity, unitPrice } = strings.headers;
  const header = [order, date, status, product, quantity, unitPrice].join(strings.delimiter);
  return ok({ filename: strings.filename, csv: `${BOM}${header}\r\n` });
}
