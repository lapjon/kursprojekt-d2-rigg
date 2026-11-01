---
name: granska
description: Granskar en ändring med subagenterna granskare och oversattningsgranskare parallellt, kontrollerar varje rapporterad brist mot koden och sammanställer resultatet. Ändrar inga filer. Startas av användaren med /granska.
argument-hint: <commit-intervall, t.ex. fe17591..HEAD, och vilka krav som gäller> (tomt = ocommittade ändringar)
disable-model-invocation: true
---

Uppdrag: $ARGUMENTS

## 1. Bestäm vad som granskas
- Om uppdraget anger ett commit-intervall, granska det: `git diff --stat <intervall>`.
- Annars: ocommittade ändringar (`git diff --stat HEAD`). Är arbetskatalogen ren, granska senaste commiten (`HEAD~1..HEAD`).
- Säg i en mening vilket intervall och vilka filer som granskas.
- Ta reda på vilka krav som gäller: det uppdraget anger, annars den feature-fil i `docs/features/` som ändringen hör till.

## 2. Kör subagenterna parallellt
- `granskare`: alltid. Ge den intervallet, kraven och `docs/standard.md`.
- `oversattningsgranskare`: bara om filer i `src/i18n/` har ändrats. Be den också kontrollera att inga texter innehåller tecken som kräver citering i CSV.
- Starta båda i samma steg, så att de körs parallellt.

## 3. Kontrollera varje brist
Subagenter kan ha fel. Läs koden för varje rapporterad brist innan den tas med:
- **Bekräftad:** bristen finns på angiven plats.
- **Bekräftad, annan rad:** bristen finns, men radnumret stämmer inte. Ange rätt rad.
- **Ej bekräftad:** bristen går inte att hitta i koden. Ta med den, men förklara varför.

## 4. Sammanställ
Visa båda rapporterna i sin helhet, och sedan en tabell:

| # | Källa | Fil:rad | Kategori | Brist | Kontroll | Förslag |

Dela upp bristerna i:
- **Bör åtgärdas:** krav som saknar test, säkerhetsbrister och brott mot standarden.
- **Mindre viktigt:** förbättringar och låg risk.
- **Beslut för Jon:** frågor som koden inte kan avgöra, som ordval och avvägningar.

## Regler
- Ändra inga filer och committa inget. Rätta inget, inte ens uppenbara fel.
- Stanna efter sammanställningen. Jon bestämmer vad som ska åtgärdas.
