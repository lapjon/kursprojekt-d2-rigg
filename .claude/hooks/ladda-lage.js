// SessionStart-hook (minneskedjan, del 2): läser in den senaste sessionsloggen
// (sessions/pass-N.md) och det automatiskt sparade läget (sessions/senaste-lage.md)
// och ger dem till Claude som kontext, så att en ny session eller /clear inte börjar från noll.
//
// Git-läget läses direkt från git vid start. senaste-lage.md sparas när Claude stannar,
// alltså före commit, och gav därför ett inaktuellt git-läge efter /clear (sessions/pass-7.md).
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const DIR = path.join(ROOT, "sessions");
const MAX_LOG = 6000;
const MAX_STATE = 3000;
const MAX_STATUS_LINES = 40;

function read(file, max) {
  try {
    const text = fs.readFileSync(file, "utf8");
    return text.length > max ? `${text.slice(0, max)}\n\n[… avkortad, läs hela filen vid behov]` : text;
  } catch {
    return "";
  }
}

function git(args) {
  try {
    return execFileSync("git", args, {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 3000,
      stdio: ["ignore", "pipe", "ignore"],
    }).trimEnd();
  } catch {
    return null;
  }
}

function limitLines(text, max) {
  const lines = text.split("\n");
  return lines.length > max ? `${lines.slice(0, max).join("\n")}\n… och ${lines.length - max} till` : text;
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
const status = git(["status", "--short"]);
const recent = git(["log", "--oneline", "-5"]);
// git status fungerar även i ett repo utan commits. Då misslyckas bara git log.
const gitState =
  status === null
    ? "Git-läget kunde inte läsas. Kontrollera med `git status` innan du utgår från senaste-lage.md."
    : [
        "Det här stämmer just nu. Git-läget i senaste-lage.md sparades tidigare och kan vara inaktuellt, så lita på det här.",
        `Ocommittade ändringar: ${status === "" ? "inga, arbetskatalogen är ren." : `\n${limitLines(status, MAX_STATUS_LINES)}`}`,
        `Senaste commits: ${recent === null || recent === "" ? "inga ännu." : `\n${recent}`}`,
      ].join("\n\n");

const loaded = [
  latest && log ? `sessions/${latest.name}` : null,
  state ? "sessions/senaste-lage.md" : null,
  status === null ? "en varning om att git-läget inte kunde läsas" : "aktuellt git-läge",
].filter(Boolean);

if (loaded.length === 0) {
  process.stdout.write(JSON.stringify({ systemMessage: "Minneskedjan: ingen sessionslogg eller sparat läge hittades." }));
  process.exit(0);
}

const parts = ["Minneskedjan (.claude/hooks/ladda-lage.js): här är läget från tidigare arbetspass. Utgå från det och fråga Jon om något är oklart."];
parts.push(`--- Aktuellt git-läge (läst nu, vid sessionsstart) ---\n${gitState}`);
if (log) parts.push(`--- Senaste sessionslogg: sessions/${latest.name} ---\n${log}`);
if (state) parts.push(`--- Automatiskt sparat läge: sessions/senaste-lage.md ---\n${state}`);

process.stdout.write(
  JSON.stringify({
    systemMessage: `Minneskedjan: laddade ${loaded.slice(0, -1).join(", ")}${loaded.length > 1 ? " och " : ""}${loaded.at(-1)}.`,
    hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: parts.join("\n\n") },
  }),
);
process.exit(0);
