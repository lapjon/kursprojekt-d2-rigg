import { exportStrings } from "../i18n/exportStrings";
import { Result, ok } from "../result";

const BOM = "\uFEFF";

export type OrderExport = { filename: string; csv: string };

export async function exportOrders(): Promise<Result<OrderExport>> {
  const strings = exportStrings.sv;
  const { order, date, status, product, quantity, unitPrice } = strings.headers;
  const header = [order, date, status, product, quantity, unitPrice].join(strings.delimiter);
  return ok({ filename: strings.filename, csv: `${BOM}${header}\r\n` });
}
