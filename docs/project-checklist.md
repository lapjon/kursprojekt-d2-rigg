# Kursprojekt – Checklista

| Krav | Planerad lösning | Bevis | Status |
|---|---|---|---|
| CLAUDE.md | Projektregler i repo-roten | CLAUDE.md, förtydligad efter två fel som agenten gjorde (`fbe79cf`) | Verifierad |
| Lint | Befintligt npm-script, utökat med SQL-regel | sessions/pass-2.md (baslinje 3f92977), SQL-regeln `9634b08`. Hook 6 stoppade BOM och SQL live (sessions/pass-7.md, pass-8.md). | Verifierad |
| Format | Befintligt npm-script | sessions/pass-2.md (baslinje 3f92977) | Baslinje grön |
| Typecheck | Befintligt npm-script | sessions/pass-2.md (baslinje 3f92977) | Baslinje grön |
| Skill 1: /tdd | `.claude/skills/tdd/SKILL.md`, anpassad till Jest och `npm test` | `.claude/skills/tdd/SKILL.md`, använd i steg 1–11 (`bf03830`–`5fda2b8`) | Verifierad |
| Skill 2 | TBD | TBD | Inte påbörjad |
| Skill 3 | TBD | TBD | Inte påbörjad |
| Subagent 1 | `kodutforskare` (Haiku) | `.claude/agents/kodutforskare.md`, research `d846f79`, Haiku enligt `/usage` | Verifierad |
| Subagent 2 | `granskare` (Sonnet) | `.claude/agents/granskare.md`. Granskningen i steg 11 hittade 8 brister, åtgärdade i `5052ad4`, `31ceaae` och `5fda2b8` (sessions/pass-8.md). | Verifierad |
| Subagent 3 | `oversattningsgranskare` (Sonnet) | `.claude/agents/oversattningsgranskare.md`. Flaggade "Avbruten" i steg 11, vilket ledde till R11 (sessions/pass-8.md). | Verifierad |
| Subagent 4 | `legacy-arkeolog` (Sonnet) | `.claude/agents/legacy-arkeolog.md` | Klar, ej verifierad |
| Hook 1 | `aktivera-venv.js` (SessionStart) | `ee30e58`, sessions/pass-6.md | Verifierad |
| Hook 2 | `skydda-tester.js` (PreToolUse) | `ee30e58`, sessions/pass-6.md | Verifierad |
| Hook 3 | `stoppa-shell-redigering.js` (PreToolUse) | `ee30e58`, sessions/pass-6.md | Verifierad |
| Hook 4 | `spara-lage.js` (Stop, minneskedjan) | `aa4d7cb`, sessions/pass-6.md | Verifierad |
| Hook 5 | `ladda-lage.js` (SessionStart, minneskedjan) | `aa4d7cb`, sessions/pass-6.md | Verifierad |
| Hook 6 | `formatera-och-lint.js` (PostToolUse) | `aa4d7cb`, sessions/pass-6.md | Verifierad |
| Allow/Ask/Deny | `.claude/settings.json`, anpassad till detta repo | `.claude/settings.json`, sessions/pass-3.md | Verifierad |
| Sessionslogg | En fil per arbetspass | `sessions/pass-1.md` till `pass-8.md` | Pågår |
| Ny funktion | #8 CSV-export, utökad med språkstöd för sv och en | docs/features/export-csv.md. 89 gröna tester, curl-kontroll och import i Google Sheets (`docs/bilder/export-sv-google-sheets.png`), sessions/pass-8.md. | Klar |
| Agentkod-review | Lärarens PR | TBD | Inte påbörjad |
| Legacy codemap | price_calc.py + callers | TBD | Inte påbörjad |
| 5 characterization tests | Python/pytest | TBD | Inte påbörjad |
| 3 refaktoreringar | Små commits | TBD | Inte påbörjad |
| DB-migrationsplan | Expand/contract | TBD | Inte påbörjad |
| Mätningar | tid/tokens/kostnad/fångade fel | `/usage` och fångade fel i sessions/pass-6.md till pass-8.md | Pågår |
| Sluttagg | inlamning | Git tag | Inte påbörjad |