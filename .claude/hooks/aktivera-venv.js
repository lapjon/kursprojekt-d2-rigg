// SessionStart-hook: aktiverar projektets .venv för alla Bash-kommandon Claude kör,
// via CLAUDE_ENV_FILE. Utan .venv startar src/pricing/legacyPrice.ts systempython,
// som saknar psycopg, och pristestet ger 404 (sessions/pass-2.md).
// Varnar om .venv saknas eller är byggd för en annan sökväg (t.ex. efter att mappen bytt namn).
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const VENV = path.join(ROOT, ".venv");
const BIN = path.join(VENV, "bin");
const FIX = "Bygg om i en terminal i repot: rm -rf .venv && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt";

function exists(p) {
  try {
    fs.lstatSync(p);
    return true;
  } catch {
    return false;
  }
}

function output(obj) {
  process.stdout.write(JSON.stringify(obj));
  process.exit(0);
}

function warn(problem) {
  output({
    systemMessage: `Varning från .claude/hooks/aktivera-venv.js: ${problem} ${FIX}`,
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: `Projektets .venv är inte aktiverad: ${problem} Pristestet och den äldre prisberäkningen kommer att misslyckas. Be Jon bygga om .venv innan du kör tester.`,
    },
  });
}

if (!exists(path.join(BIN, "python3"))) {
  warn(".venv saknas i projektet.");
}

// En venv har sin sökväg inbyggd i bin/activate. Stämmer den inte är venv:en byggd för en annan mapp.
try {
  const activate = fs.readFileSync(path.join(BIN, "activate"), "utf8");
  // Sökvägen står med eller utan citattecken beroende på Python-version.
  const match = activate.match(/export VIRTUAL_ENV=['"]?([^'"\n]+?)['"]?\s*$/m);
  if (match && path.resolve(match[1]) !== path.resolve(VENV)) {
    warn(`.venv är byggd för en annan sökväg (${match[1]}).`);
  }
} catch {
  // Ingen activate-fil att jämföra med. Fortsätt och aktivera ändå.
}

const quote = (s) => `'${s.replace(/'/g, "'\\''")}'`;
const envFile = process.env.CLAUDE_ENV_FILE;
if (envFile) {
  fs.appendFileSync(envFile, `export VIRTUAL_ENV=${quote(VENV)}\nexport PATH=${quote(BIN)}:"$PATH"\n`);
}

output({
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext: envFile
      ? `Projektets .venv (${VENV}) är aktiverad för alla Bash-kommandon i sessionen via .claude/hooks/aktivera-venv.js.`
      : "CLAUDE_ENV_FILE saknades, så .venv kunde inte aktiveras automatiskt. Kontrollera att Claude Code startades med .venv aktiverad.",
  },
});
