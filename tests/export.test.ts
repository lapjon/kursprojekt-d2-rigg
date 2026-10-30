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
});
