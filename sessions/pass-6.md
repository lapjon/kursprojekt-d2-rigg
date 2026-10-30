# Pass 6 – Hooks (6 st) och namnbyte av mappen

Datum: 2026-10-30, cirka 15:57–17:35.

## Läge

- Riggen har 6 hooks, alla verifierade i Claude Code. Kravet på minst 5, med minneskedjan och testskyddet, är uppfyllt.
- Repot ligger nu i `~/AI-kurs/Delkurs2/Kursprojekt-D2/repo` (tidigare `Delkurs 2`, med mellanslag).
- Arbete 1 står kvar på steg 2 av 11 (22 gröna tester).
- **Nästa:** steg 3 i `docs/plan.md` (validering av `lang`). Starta `/tdd` genom att skriva `/td` och välja i listan.

## Fungerade (med bevis)

| Hook | Händelse | Verifiering i Claude Code |
|---|---|---|
| `aktivera-venv.js` | SessionStart | `claude` startad utan `(.venv)`: `which python3` och `$VIRTUAL_ENV` pekade på projektets `.venv` |
| `skydda-tester.js` | PreToolUse | Edit med `.skip` i `tests/export.test.ts`: blockerad, filen oförändrad |
| `stoppa-shell-redigering.js` | PreToolUse | `sed -i` i `exportStrings.ts`: blockerad innan kommandot kördes |
| `spara-lage.js` | Stop | `sessions/senaste-lage.md` skapades efter första svaret |
| `ladda-lage.js` | SessionStart | Efter `/clear`: "Minneskedjan: laddade sessions/pass-5.md och sessions/senaste-lage.md". Agenten räknade upp fem ocommittade filer utan verktygsanrop. |
| `formatera-och-lint.js` | PostToolUse | Oanvänd variabel i `exportService.ts`: ESLint-felet visades direkt, och agenten tog bort raden |

- `ee30e58` hooks 1–3, testade med 32 fall utanför Claude Code.
- `aa4d7cb` hooks 4–6, testade med 14 fall utanför Claude Code.

## Vad kontrollerna fångade

| Kontroll | Fångade |
|---|---|
| Egna tester av hookarna | `->` och `=>` tolkades som omdirigering. Sökväg utan citattecken i nyare venv-format matchades inte. Båda rättades före commit. |
| Läsning av Claude Codes dokumentation | `CLAUDE_ENV_FILE` gjorde att `.venv` kan aktiveras automatiskt i stället för att bara varna. Dokumentationen ändrade designen. |
| Instruktion i `CLAUDE.md` | Agenten vägrade `.skip` och `sed -i` innan hookarna fick reagera. Testerna fick formuleras som avsiktliga för att nå det tekniska lagret. |

## Misslyckades

- **Namnbytet `Delkurs 2` → `Delkurs2`** förstörde `.venv`, eftersom sökvägen är inbyggd i `bin/activate`. VS Code öppnade också den gamla sökvägen, som återskapades som en tom mapp. Åtgärd: öppna `repo` direkt, lita på mappen och bygg om `.venv`. `aktivera-venv.js` varnar nu om `.venv` är byggd för en annan sökväg.
- **Git lämnade låsfiler** efter en commit från chatten, eftersom borttagningsbehörigheten gällde den gamla sökvägen. Städat, och `git fsck` utan fel.
- **Första agentsvaret om `which python3` var inget bevis.** Det stod "Searched for 1 pattern". Bekräftat med Ctrl+O att kommandot verkligen kördes.

## Återstår

- Arbete 1: steg 3–11 i `docs/plan.md`.
- Två skills till (förslag: `/granska` och `/sessionslogg`).
- Fler regler ur `docs/standard.md` som ESLint-regler.
- Arbete 2 (väntar på PR) och Arbete 3.

## Beslut

- Hooks skrivs i Node, utan nya beroenden, och testas med påhittad JSON före live-test.
- Hookar som matchar text är skyddsräcken, ingen säkerhetsgräns (samma som deny-reglerna). Sandlåda är nästa lager.
- `sessions/senaste-lage.md` ligger i `.gitignore`. De committade `pass-N.md` är det granskade minnet.
- Minneskedjan sparar vid Stop (varje svar), inte bara vid avslut, så att läget finns kvar även om sessionen kraschar.
- Hooktester formuleras som avsiktliga ("Det här är ett avsiktligt test av hooken …") så att instruktionslagret inte stoppar före hooken.

## Förbrukning

- Hookarna skrevs och testades i chatten, inte i Claude Code, och mättes därför inte med `/usage`.
- Verifieringen av hook 1–3 i Claude Code: inte uppmätt.
- Verifieringen av hook 4–6 i Claude Code (Sonnet 5.5): $0,20, 4 min 45 s, varav 30 s modelltid. 1 rad tillagd och 1 borttagen (testet med oanvänd variabel).
  - Sonnet: 517 input, 1,3k output, 247,5k cache read, 39,4k cache write ($0,1960).
  - Haiku: 1,2k input, 165 output ($0,0002), Claude Codes interna anrop.
- Kvot vid 17:37: 37 % av femtimmarsfönstret (nytt fönster, återställs 20:40), 22 % av veckan.

## Start nästa pass

1. Öppna `repo` i VS Code och kör `npm run db:up` om Docker har startats om. `.venv` aktiveras av hooken.
2. Starta `claude` och kontrollera `manual mode on` och meddelandet "Minneskedjan: laddade …".
3. `/clear` före steg 3, och starta sedan `/tdd` från listan.
