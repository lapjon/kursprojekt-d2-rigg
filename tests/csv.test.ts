import { escapeField } from "../src/csv";

describe("escapeField", () => {
  it("omger ett fält som innehåller avgränsaren ; med citattecken", () => {
    expect(escapeField("a;b", ";")).toBe('"a;b"');
  });

  it("omger ett fält med citattecken och dubblerar det inre citattecknet", () => {
    expect(escapeField('a"b', ";")).toBe('"a""b"');
  });

  it.each([
    ["\n", "a\nb"],
    ["\r", "a\rb"],
  ])("omger ett fält med radbrytning %j med citattecken", (_label, value) => {
    expect(escapeField(value, ";")).toBe(`"${value}"`);
  });
});
