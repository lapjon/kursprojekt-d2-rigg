# Kursprojekt – Checklista

| Krav | Planerad lösning | Bevis | Status |
|---|---|---|---|
| CLAUDE.md | Projektregler i repo-roten | CLAUDE.md | Påbörjad |
| Lint | Befintligt npm-script | sessions/pass-2.md (baslinje 3f92977) | Baslinje grön |
| Format | Befintligt npm-script | sessions/pass-2.md (baslinje 3f92977) | Baslinje grön |
| Typecheck | Befintligt npm-script | sessions/pass-2.md (baslinje 3f92977) | Baslinje grön |
| Skill 1: /tdd | `.claude/skills/tdd/SKILL.md`, anpassad till Jest och `npm test` | `.claude/skills/tdd/SKILL.md`, använd i steg 1 (`bf03830`–`f3555ae`) | Verifierad |
| Skill 2 | TBD | TBD | Inte påbörjad |
| Skill 3 | TBD | TBD | Inte påbörjad |
| Subagent 1 | `kodutforskare` (Haiku) | `.claude/agents/kodutforskare.md`, research `d846f79`, Haiku enligt `/usage` | Verifierad |
| Subagent 2 | `granskare` (Sonnet) | `.claude/agents/granskare.md` | Klar, ej verifierad |
| Subagent 3 | `oversattningsgranskare` (Sonnet) | `.claude/agents/oversattningsgranskare.md` | Klar, ej verifierad |
| Subagent 4 | `legacy-arkeolog` (Sonnet) | `.claude/agents/legacy-arkeolog.md` | Klar, ej verifierad |
| Hook 1 | `aktivera-venv.js` (SessionStart) | `ee30e58`, sessions/pass-6.md | Verifierad |
| Hook 2 | `skydda-tester.js` (PreToolUse) | `ee30e58`, sessions/pass-6.md | Verifierad |
| Hook 3 | `stoppa-shell-redigering.js` (PreToolUse) | `ee30e58`, sessions/pass-6.md | Verifierad |
| Hook 4 | `spara-lage.js` (Stop, minneskedjan) | `aa4d7cb`, sessions/pass-6.md | Verifierad |
| Hook 5 | `ladda-lage.js` (SessionStart, minneskedjan) | `aa4d7cb`, sessions/pass-6.md | Verifierad |
| Hook 6 | `formatera-och-lint.js` (PostToolUse) | `aa4d7cb`, sessions/pass-6.md | Verifierad |
| Allow/Ask/Deny | `.claude/settings.json`, anpassad till detta repo | `.claude/settings.json`, sessions/pass-3.md | Verifierad |
| Sessionslogg | En fil per arbetspass | sessions/ | Inte påbörjad |
| Ny funktion | #8 CSV-export, utökad med språkstöd för sv och en | docs/features/export-csv.md | Påbörjad |
| Agentkod-review | Lärarens PR | TBD | Inte påbörjad |
| Legacy codemap | price_calc.py + callers | TBD | Inte påbörjad |
| 5 characterization tests | Python/pytest | TBD | Inte påbörjad |
| 3 refaktoreringar | Små commits | TBD | Inte påbörjad |
| DB-migrationsplan | Expand/contract | TBD | Inte påbörjad |
| Mätningar | tid/tokens/kostnad/fångade fel | sessions/ | Inte påbörjad |
| Sluttagg | inlamning | Git tag | Inte påbörjad |