// Stop-hook (minneskedjan, del 1): sparar sessionens läge efter varje svar från Claude
// i sessions/senaste-lage.md. Läses in av ladda-lage.js när nästa session startar.
// Filen ligger i .gitignore. De committade sessions/pass-N.md är det granskade minnet.
// Hooken blockerar aldrig (alltid exitkod 0), så Claude kan inte fastna i en loop.
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const FILE = path.join(ROOT, "sessions", "senaste-lage.md");

function git(args) {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

try {
  let input = {};
  try {
    input = JSON.parse(fs.readFileSync(0, "utf8"));
  } catch {
    // Saknad eller oläslig indata: spara läget ändå.
  }

  const now = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());
  const status = git(["status", "--short"]);
  const reply = (input.last_assistant_message || "").trim().slice(0, 1500);

  const text = [
    "# Senaste läge",
    "",
    "Skrivs automatiskt av `.claude/hooks/spara-lage.js` efter varje svar. Ändra inte för hand.",
    "",
    `Senast uppdaterad: ${now} (Europe/Stockholm)`,
    input.session_id ? `Session: ${input.session_id}` : "",
    "",
    "## Git",
    "",
    `Senaste commit: ${git(["log", "-1", "--format=%h %s"]) || "okänd"}`,
    "",
    "Ocommittade filer:",
    status ? status.split("\n").map((l) => `- \`${l.trim()}\``).join("\n") : "- (inga)",
    "",
    "## Senaste commits",
    "",
    git(["log", "-5", "--format=- %h %s"]) || "- (inga)",
    "",
    "## Claudes senaste svar (början)",
    "",
    reply || "(saknas)",
    "",
  ]
    .filter((line, i, all) => !(line === "" && all[i - 1] === ""))
    .join("\n");

  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, text);
} catch {
  // Minnet är en hjälp, inte ett krav för att arbeta: misslyckas sparandet stoppar vi ingenting.
}
process.exit(0);
