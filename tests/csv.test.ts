import { escapeField, neutralizeFormula } from "../src/csv";

describe("escapeField", () => {
  it("omger ett fält som innehåller avgränsaren ; med citattecken", () => {
    expect(escapeField("a;b", ";")).toBe('"a;b"');
  });

  it("omger ett fält som innehåller avgränsaren , med citattecken", () => {
    expect(escapeField("a,b", ",")).toBe('"a,b"');
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

  it.each([
    ["ett vanligt fält", "abc", ";"],
    ["; när avgränsaren är ,", "a;b", ","],
  ])("lämnar %s oförändrat", (_label, value, delimiter) => {
    expect(escapeField(value, delimiter)).toBe(value);
  });
});

describe("neutralizeFormula", () => {
  it("sätter ett ' först i ett fält som börjar med =", () => {
    expect(neutralizeFormula("=1+1")).toBe("'=1+1");
  });

  it.each([
    ["+", "+1"],
    ["-", "-1"],
    ["@", "@SUM(1)"],
    ["tabb", "\tx"],
    ["vagnretur", "\rx"],
    ["radmatning", "\nx"],
    ["fullbredds ＝", "＝1+1"],
    ["fullbredds ＋", "＋1"],
    ["fullbredds －", "－1"],
    ["fullbredds ＠", "＠SUM(1)"],
  ])("sätter ett ' först i ett fält som börjar med %s", (_label, value) => {
    expect(neutralizeFormula(value)).toBe(`'${value}`);
  });

  it.each([
    ["abc", "abc"],
    ["a=b", "a=b"],
    ["1-2", "1-2"],
    ["'x", "'x"],
  ])("lämnar %s oförändrat när formeltecknet inte står först", (_label, value) => {
    expect(neutralizeFormula(value)).toBe(value);
  });
});
