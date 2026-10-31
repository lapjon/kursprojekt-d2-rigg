import { escapeField } from "../src/csv";

describe("escapeField", () => {
  it("omger ett fält som innehåller avgränsaren ; med citattecken", () => {
    expect(escapeField("a;b", ";")).toBe('"a;b"');
  });
});
