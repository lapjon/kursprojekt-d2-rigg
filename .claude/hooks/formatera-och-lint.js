// PostToolUse-hook för Edit, Write och MultiEdit: formaterar den ändrade filen med Prettier
// och kontrollerar den med ESLint, om den är en TypeScript-fil i src/ eller tests/.
// Vid lintfel: exitkod 2, och felet visas för Claude så att det rättas i samma varv.
// Ändringen är redan gjord när hooken körs, så den stoppar inget, men felet syns direkt.
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const BIN = path.join(ROOT, "node_modules", ".bin");

let input;
try {
  input = JSON.parse(fs.readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}

const filePath = input.tool_input && input.tool_input.file_path;
if (!filePath) process.exit(0);
const abs = path.resolve(ROOT, filePath);
const rel = path.relative(ROOT, abs).split(path.sep).join("/");
if (!/^(src|tests)\/.*\.ts$/.test(rel) || !fs.existsSync(abs)) process.exit(0);

const run = (tool, args) => spawnSync(path.join(BIN, tool), args, { cwd: ROOT, encoding: "utf8" });

const before = fs.readFileSync(abs, "utf8");
const prettier = run("prettier", ["--write", rel]);
if (prettier.status !== 0) {
  process.stderr.write(
    `formatera-och-lint.js: Prettier kunde inte formatera ${rel}, troligen ett syntaxfel. Rätta filen.\n${prettier.stderr || prettier.stdout}\n`,
  );
  process.exit(2);
}

const eslint = run("eslint", [rel]);
if (eslint.status !== 0) {
  process.stderr.write(
    `formatera-och-lint.js: ESLint hittade fel i ${rel}. Rätta dem innan du går vidare ` +
      "(se docs/standard.md och kommentarerna i eslint.config.js).\n" +
      `${eslint.stdout || eslint.stderr}\n`,
  );
  process.exit(2);
}

if (fs.readFileSync(abs, "utf8") !== before) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: `Prettier formaterade ${rel} efter ändringen. Läs om filen innan nästa Edit i den.`,
      },
    }),
  );
}
process.exit(0);
