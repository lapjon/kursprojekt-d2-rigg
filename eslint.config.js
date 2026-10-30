// Grundkonfiguration. Projektets egna regler ur docs/standard.md är inte inlagda här än.
const js = require("@eslint/js");
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
  { ignores: ["dist/", "node_modules/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Osynliga tecken (t.ex. BOM U+FEFF) i strängar syns inte i en diff.
      // Skriv dem som escapesekvenser, till exempel "\uFEFF".
      "no-irregular-whitespace": ["error", { skipStrings: false, skipTemplates: false }],
    },
  },
);
