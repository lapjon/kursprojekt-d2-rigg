// PreToolUse-hook: stoppar att tester tas bort, hoppas över eller stängs av.
// Kopplas in för Edit, Write, MultiEdit och Bash i .claude/settings.json.
// Exitkod 2 blockerar verktygsanropet, och texten på stderr visas för Claude.
// Hooken matchar text och är ett skyddsräcke, ingen säkerhetsgräns.
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();

// Sätt att hoppa över eller stänga av ett test, i Jest och pytest.
const SKIP_PATTERNS = [
  /\b(?:it|test|describe)\.(?:skip|only)\s*\(/g,
  /\bx(?:it|test|describe)\s*\(/g,
  /@pytest\.mark\.(?:skip|skipif|xfail)\b/g,
  /\bpytest\.skip\s*\(/g,
];
// Ett test i Jest (it/test) eller pytest (def test_...).
const TEST_PATTERN = /\b(?:it|test)\s*\(|\bdef\s+test_\w*\s*\(/g;

// Bash-kommandon som tar bort, flyttar eller återställer testfiler,
// eller får Jest att hoppa över testfiler.
const BASH_PATTERNS = [
  /\b(?:rm|mv|git\s+rm|git\s+mv|git\s+restore|git\s+checkout\s+--|git\s+stash)\b[^;&|]*\btests\//,
  /--testPathIgnorePatterns\b/,
];

const MESSAGE =
  "Blockerat av .claude/hooks/skydda-tester.js: tester får inte tas bort, hoppas över eller stängas av " +
  "(CLAUDE.md och kursprojektets regler). Om ett test verkar fel: beskriv varför och fråga Jon i stället för att ändra det.";

function countMatches(text, patterns) {
  return patterns.reduce((sum, re) => sum + ((text || "").match(re) || []).length, 0);
}

function isTestFile(filePath) {
  if (!filePath) return false;
  const rel = path.relative(ROOT, path.resolve(ROOT, filePath)).split(path.sep).join("/");
  return rel.startsWith("tests/") || /\.test\.[jt]s$/.test(rel) || /(^|\/)test_[^/]*\.py$/.test(rel);
}

function weakens(before, after) {
  const addsSkip = countMatches(after, SKIP_PATTERNS) > countMatches(before, SKIP_PATTERNS);
  const removesTest = countMatches(after, [TEST_PATTERN]) < countMatches(before, [TEST_PATTERN]);
  return addsSkip || removesTest;
}

function block(detail) {
  process.stderr.write(`${MESSAGE}\n${detail}\n`);
  process.exit(2);
}

let input;
try {
  input = JSON.parse(fs.readFileSync(0, "utf8"));
} catch {
  process.exit(0); // Oläslig indata: släpp igenom hellre än att stoppa allt arbete.
}

const tool = input.tool_name;
const ti = input.tool_input || {};

if (tool === "Bash") {
  const command = ti.command || "";
  if (BASH_PATTERNS.some((re) => re.test(command))) block(`Kommando: ${command}`);
} else if (tool === "Edit" && isTestFile(ti.file_path)) {
  if (weakens(ti.old_string, ti.new_string)) block(`Fil: ${ti.file_path}`);
} else if (tool === "MultiEdit" && isTestFile(ti.file_path)) {
  const edits = ti.edits || [];
  const before = edits.map((e) => e.old_string || "").join("\n");
  const after = edits.map((e) => e.new_string || "").join("\n");
  if (weakens(before, after)) block(`Fil: ${ti.file_path}`);
} else if (tool === "Write" && isTestFile(ti.file_path)) {
  const target = path.resolve(ROOT, ti.file_path);
  const before = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
  if (weakens(before, ti.content)) block(`Fil: ${ti.file_path}`);
}

process.exit(0);
