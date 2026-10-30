// SessionStart-hook (minneskedjan, del 2): läser in den senaste sessionsloggen
// (sessions/pass-N.md) och det automatiskt sparade läget (sessions/senaste-lage.md)
// och ger dem till Claude som kontext, så att en ny session eller /clear inte börjar från noll.
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const DIR = path.join(ROOT, "sessions");
const MAX_LOG = 6000;
const MAX_STATE = 3000;

function read(file, max) {
  try {
    const text = fs.readFileSync(file, "utf8");
    return text.length > max ? `${text.slice(0, max)}\n\n[… avkortad, läs hela filen vid behov]` : text;
  } catch {
    return "";
  }
}

let latest = null;
try {
  latest = fs
    .readdirSync(DIR)
    .map((name) => ({ name, n: Number((name.match(/^pass-(\d+)\.md$/) || [])[1]) }))
    .filter((f) => Number.isInteger(f.n))
    .sort((a, b) => b.n - a.n)[0];
} catch {
  // Ingen sessions-mapp.
}

const log = latest ? read(path.join(DIR, latest.name), MAX_LOG) : "";
const state = read(path.join(DIR, "senaste-lage.md"), MAX_STATE);
const loaded = [latest && log ? `sessions/${latest.name}` : null, state ? "sessions/senaste-lage.md" : null].filter(Boolean);

if (loaded.length === 0) {
  process.stdout.write(JSON.stringify({ systemMessage: "Minneskedjan: ingen sessionslogg eller sparat läge hittades." }));
  process.exit(0);
}

const parts = ["Minneskedjan (.claude/hooks/ladda-lage.js): här är läget från tidigare arbetspass. Utgå från det och fråga Jon om något är oklart."];
if (log) parts.push(`--- Senaste sessionslogg: sessions/${latest.name} ---\n${log}`);
if (state) parts.push(`--- Automatiskt sparat läge: sessions/senaste-lage.md ---\n${state}`);

process.stdout.write(
  JSON.stringify({
    systemMessage: `Minneskedjan: laddade ${loaded.join(" och ")}.`,
    hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: parts.join("\n\n") },
  }),
);
process.exit(0);
