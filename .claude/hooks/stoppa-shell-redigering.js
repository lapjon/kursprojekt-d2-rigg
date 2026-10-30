// PreToolUse-hook för Bash: stoppar kommandon som ändrar filer i projektet,
// så att ändringar görs med Edit eller Write och syns i diffen (CLAUDE.md).
// Läsande kommandon (cat, grep, sed -n, git diff) och skrivning till /tmp och /dev påverkas inte.
// Hooken matchar kommandotexten och är ett skyddsräcke, ingen säkerhetsgräns.
const fs = require("node:fs");

const PATTERNS = [
  { re: /\bsed\b[^|;&]*\s-[A-Za-z]*i/, why: "sed -i ändrar filen på plats" },
  { re: /\bperl\b[^|;&]*\s-[A-Za-z]*i/, why: "perl -i ändrar filen på plats" },
  {
    // Omdirigering > eller >> till en fil, men inte 2>&1, &>, >&2, /dev/... eller /tmp/...
    // och inte pilar som -> och => i text eller kod.
    re: /(?:^|[^0-9&>=-])>{1,2}\s*(?!&|\/dev\/|\/tmp\/|["']\/dev\/|["']\/tmp\/)["']?[\w.~/-]+/,
    why: "omdirigering (> eller >>) skriver till en fil",
  },
  { re: /\btee\b(?:\s+-a)?\s+(?!\/dev\/|\/tmp\/)[\w.~/"'-]+/, why: "tee skriver till en fil" },
  {
    re: /\b(?:python3?|node)\b[^|;&]*\s-[ce]\b[\s\S]*\b(?:writeFileSync|appendFileSync|write_text|write_bytes|open\([^)]*['"][wa+])/,
    why: "ett inline-skript skriver till en fil",
  },
];

let input;
try {
  input = JSON.parse(fs.readFileSync(0, "utf8"));
} catch {
  process.exit(0); // Oläslig indata: släpp igenom hellre än att stoppa allt arbete.
}

if (input.tool_name !== "Bash") process.exit(0);
const command = (input.tool_input && input.tool_input.command) || "";
const hit = PATTERNS.find((p) => p.re.test(command));

if (hit) {
  process.stderr.write(
    "Blockerat av .claude/hooks/stoppa-shell-redigering.js: " +
      `${hit.why}. Ändra filer med Edit eller Write så att ändringen syns i diffen och kan godkännas (CLAUDE.md). ` +
      "Om Edit inte fungerar: beskriv problemet och fråga Jon.\n" +
      `Kommando: ${command}\n`,
  );
  process.exit(2);
}
process.exit(0);
