import request from "supertest";
import { createApp } from "../src/app";
import { db } from "../src/db";
import { closeDb, resetDb } from "./helpers/db";

const app = createApp();

beforeEach(resetDb);
afterAll(closeDb);

describe("GET /customers/me/orders/export", () => {
  it("returnerar 401 utan X-Customer-Id", async () => {
    const res = await request(app).get("/customers/me/orders/export");
    expect(res.status).toBe(401);
  });

  it("returnerar 200 med CSV-headers för kund 7", async () => {
    const res = await request(app).get("/customers/me/orders/export").set("X-Customer-Id", "7");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("text/csv; charset=utf-8");
    expect(res.headers["content-disposition"]).toBe('attachment; filename="bestallningar.csv"');
  });

  it("returnerar BOM och svensk rubrikrad med CRLF för kund 7", async () => {
    const res = await request(app).get("/customers/me/orders/export").set("X-Customer-Id", "7");
    expect(res.text).toBe("\uFEFFBeställning;Datum;Status;Produkt;Antal;À-pris\r\n");
  });

  it("returnerar engelsk rubrikrad och orders.csv med lang=en", async () => {
    const res = await request(app)
      .get("/customers/me/orders/export?lang=en")
      .set("X-Customer-Id", "7");
    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toBe('attachment; filename="orders.csv"');
    expect(res.text).toBe("\uFEFFOrder,Date,Status,Product,Quantity,Unit price\r\n");
  });

  it("tolkar lang=SV som svenska", async () => {
    const res = await request(app)
      .get("/customers/me/orders/export?lang=SV")
      .set("X-Customer-Id", "7");
    expect(res.headers["content-disposition"]).toBe('attachment; filename="bestallningar.csv"');
    expect(res.text.split("\r\n")[0]).toContain(";");
  });

  it("tolkar lang=EN som engelska", async () => {
    const res = await request(app)
      .get("/customers/me/orders/export?lang=EN")
      .set("X-Customer-Id", "7");
    expect(res.headers["content-disposition"]).toBe('attachment; filename="orders.csv"');
  });

  it("returnerar 400 invalid_input för lang=de", async () => {
    const res = await request(app)
      .get("/customers/me/orders/export?lang=de")
      .set("X-Customer-Id", "7");
    expect(res.status).toBe(400);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body).toEqual({
      error: { code: "invalid_input", message: "lang måste vara sv eller en." },
    });
  });

  it("returnerar 400 invalid_input för lang utan värde", async () => {
    const res = await request(app)
      .get("/customers/me/orders/export?lang=")
      .set("X-Customer-Id", "7");
    expect(res.status).toBe(400);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body.error.code).toBe("invalid_input");
  });

  it("returnerar rubrikrad och en datarad per orderrad för kund 1, utan kund 2:s beställning", async () => {
    const res = await request(app).get("/customers/me/orders/export").set("X-Customer-Id", "1");
    const lines = res.text.replace("\u{FEFF}", "").split("\r\n").filter(Boolean);
    expect(lines).toHaveLength(4);
    expect(lines[0]).toBe("Beställning;Datum;Status;Produkt;Antal;À-pris");
    const rows = lines.slice(1).map((line) => line.split(";"));
    const summary = rows.map((cells) => [cells[0], cells[3], cells[4]]);
    expect(summary).toEqual(
      expect.arrayContaining([
        ["1040", "Hörlurar", "1"],
        ["1042", "Skrivbordslampa", "2"],
        ["1042", "Musmatta", "1"],
      ]),
    );
    expect(rows.map((cells) => cells[0])).not.toContain("1041");
  });

  it("sorterar beställningar nyast först och orderrader i tillagd ordning för kund 1", async () => {
    const res = await request(app).get("/customers/me/orders/export").set("X-Customer-Id", "1");
    const lines = res.text.replace("\u{FEFF}", "").split("\r\n").filter(Boolean);
    const summary = lines.slice(1).map((line) => {
      const cells = line.split(";");
      return [cells[0], cells[3]];
    });
    expect(summary).toEqual([
      ["1042", "Skrivbordslampa"],
      ["1042", "Musmatta"],
      ["1040", "Hörlurar"],
    ]);
  });

  it("sorterar beställningar med samma created_at på id, högst först", async () => {
    await db.query(
      `INSERT INTO orders (id, customer_id, status, created_at) VALUES
         (3001, 1, 'new', '2026-11-01 12:00:00+01'),
         (3002, 1, 'new', '2026-11-01 12:00:00+01')`,
    );
    await db.query(
      `INSERT INTO order_lines (order_id, product, quantity, unit_price) VALUES
         (3001, 'Pennhållare', 1, 50.00),
         (3002, 'Skrivunderlägg', 1, 80.00)`,
    );
    const res = await request(app).get("/customers/me/orders/export").set("X-Customer-Id", "1");
    const lines = res.text.replace("\u{FEFF}", "").split("\r\n").filter(Boolean);
    const orderIds = lines.slice(1).map((line) => line.split(";")[0]);
    expect(orderIds.slice(0, 2)).toEqual(["3002", "3001"]);
  });

  it("ger en datarad med tomma produktfält för beställning utan rader och avslutar varje rad med CRLF", async () => {
    const res = await request(app).get("/customers/me/orders/export").set("X-Customer-Id", "3");
    const body = res.text.replace("\u{FEFF}", "");
    expect(body.endsWith("\r\n")).toBe(true);
    expect(body.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
    const lines = body.split("\r\n").filter(Boolean);
    expect(lines).toHaveLength(2);
    const cells = lines[1].split(";");
    expect(cells).toHaveLength(6);
    expect(cells[0]).toBe("1043");
    expect([cells[3], cells[4], cells[5]]).toEqual(["", "", ""]);
  });

  it("returnerar 400 invalid_input när lang förekommer flera gånger", async () => {
    const res = await request(app)
      .get("/customers/me/orders/export?lang=sv&lang=en")
      .set("X-Customer-Id", "7");
    expect(res.status).toBe(400);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body.error.code).toBe("invalid_input");
  });
});
