import { ExportLang, exportStrings } from "../i18n/exportStrings";
import { Result, ok } from "../result";

const BOM = "\uFEFF";

export type OrderExport = { filename: string; csv: string };

export async function exportOrders(lang?: unknown): Promise<Result<OrderExport>> {
  const language: ExportLang =
    typeof lang === "string" && lang.toLowerCase() === "en" ? "en" : "sv";
  const strings = exportStrings[language];
  const { order, date, status, product, quantity, unitPrice } = strings.headers;
  const header = [order, date, status, product, quantity, unitPrice].join(strings.delimiter);
  return ok({ filename: strings.filename, csv: `${BOM}${header}\r\n` });
}
