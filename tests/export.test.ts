import request from "supertest";
import { createApp } from "../src/app";
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
});
