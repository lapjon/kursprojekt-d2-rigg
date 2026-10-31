import { escapeField } from "../csv";
import { db } from "../db";
import { ExportLang, ExportStrings, exportStrings } from "../i18n/exportStrings";
import { Result, err, ok } from "../result";

const BOM = "\uFEFF";

// sv-SE ger ÅÅÅÅ-MM-DD i båda exportspråken. Tidszonen anges uttryckligen så att
// resultatet inte beror på serverns tidszon.
const dateFormat = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" });

export type OrderExport = { filename: string; csv: string };

export async function exportOrders(
  customerId: number,
  lang?: unknown,
): Promise<Result<OrderExport>> {
  const requested = lang === undefined ? "sv" : typeof lang === "string" && lang.toLowerCase();
  if (requested !== "sv" && requested !== "en") {
    return err("invalid_input", "lang måste vara sv eller en.");
  }
  const language: ExportLang = requested;
  const strings = exportStrings[language];
  const { order, date, status, product, quantity, unitPrice } = strings.headers;
  const header = [order, date, status, product, quantity, unitPrice].join(strings.delimiter);
  const res = await db.query(
    `SELECT o.id, o.created_at AS "createdAt", o.status, l.product, l.quantity,
            l.unit_price AS "unitPrice"
       FROM orders o
       LEFT JOIN order_lines l ON l.order_id = o.id
      WHERE o.customer_id = $1
      ORDER BY o.created_at DESC, o.id DESC, l.id`,
    [customerId],
  );
  const dataRows = res.rows.map(
    (row) =>
      [
        row.id,
        dateFormat.format(row.createdAt),
        Object.hasOwn(strings.statuses, row.status)
          ? strings.statuses[row.status as keyof ExportStrings["statuses"]]
          : row.status,
        row.product,
        row.quantity,
        row.unitPrice?.replace(".", strings.decimalSeparator),
      ]
        .map((field) => escapeField(String(field ?? ""), strings.delimiter))
        .join(strings.delimiter) + "\r\n",
  );
  return ok({ filename: strings.filename, csv: `${BOM}${header}\r\n${dataRows.join("")}` });
}
