// Grundkonfiguration plus de regler ur docs/standard.md som går att kontrollera automatiskt (se kommentarerna).
const js = require("@eslint/js");
const tseslint = require("typescript-eslint");

const SQL_MESSAGE =
  "SQL får inte byggas med strängmall eller sammanslagning. Använd $1, $2 … och skicka värdena i en lista: db.query(sql, [värde]). Se docs/standard.md.";

module.exports = tseslint.config(
  { ignores: ["dist/", "node_modules/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Osynliga tecken (t.ex. BOM U+FEFF) i strängar syns inte i en diff.
      // Skriv dem som escapesekvenser, till exempel "\uFEFF".
      "no-irregular-whitespace": ["error", { skipStrings: false, skipTemplates: false }],
      // docs/standard.md, Databas: SQL är alltid parametriserad.
      "no-restricted-syntax": [
        "error",
        { selector: "CallExpression[callee.property.name='query'] > TemplateLiteral[expressions.length>0]", message: SQL_MESSAGE },
        { selector: "CallExpression[callee.property.name='query'] > BinaryExpression[operator='+']", message: SQL_MESSAGE },
        {
          selector:
            "TemplateLiteral[expressions.length>0]:has(TemplateElement[value.raw=/\\b(insert\\s+into|update\\s+\\w+\\s+set|delete\\s+from)\\b/i])",
          message: SQL_MESSAGE,
        },
        {
          selector:
            "TemplateLiteral[expressions.length>0][quasis.0.value.raw=/^\\s*select\\b/i]:has(TemplateElement[value.raw=/\\bfrom\\b/i])",
          message: SQL_MESSAGE,
        },
      ],
    },
  },
  {
    // Hookarna och konfigurationsfilerna är CommonJS-skript som körs i Node.
    files: [".claude/hooks/**/*.js", "*.config.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: { require: "readonly", module: "writable", process: "readonly", __dirname: "readonly", console: "readonly" },
    },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
);
