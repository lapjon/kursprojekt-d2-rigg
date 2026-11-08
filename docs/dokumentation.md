# Dokumentation enligt mallen

Utkast till svaren i kursens mall (sidorna 4–9), en rubrik per ruta. Svaren är korta, eftersom rutorna i PDF:en är små, och pekar på repot där detaljerna finns. Den här filen är källan, och PDF:en fylls i från den.

Status: sida 4 ifylld. Sidorna 5–9 återstår. Sida 7 väntar på Arbete 2.

---

## Sida 4

**Namn:** Jon Laprevote
**Kodbas:** Delkursens övningsprojekt (butikens API och äldre prisberäkning)
**Repo och tagg:** [repo-URL fylls i vid inlämning], taggen `inlamning`

### Kodbas, krav och beslut

#### Vilken kodbas, och varför

Övningsprojektet: ett REST-API i TypeScript (Express, PostgreSQL i Docker, Jest) och en äldre, otestad prisberäkning i Python. Det rymmer alla tre arbetena i samma repo: en ny funktion i API:t, en äldre del att modernisera och en databas för migreringsplanen. En egen kodbas hade behövt en äldre del, körbara tester och godkännande, utan att tillföra något för uppgiften. Se `README.md` och `docs/project-brief.md`.

#### User story och acceptanskriterier

> Som kund vill jag kunna ladda ner mina beställningar som en CSV-fil på svenska eller engelska, så att jag kan öppna dem i Excel med rätt språk och format för min region.

User story #8, utökad med språkstöd. Urval av de 19 kriterierna (alla finns i `docs/features/export-csv.md`):

- **Givet** att kund 1 är inloggad, **när** kunden hämtar exporten med `lang=sv`, **så** blir svaret 200 med `bestallningar.csv`, en rubrikrad och en rad per orderrad.
- **Givet** `lang=en`, **så** är rubrikraden `Order,Date,Status,Product,Quantity,Unit price` och filnamnet `orders.csv`.
- **Givet** à-priset 375.00, **så** står det `375,00` med sv och `375.00` med en.
- **Givet** ett produktnamn som börjar med `=`, `+`, `-` eller `@`, **så** får fältet ett `'` först och tolkas inte som en formel.
- **Givet** `lang=de`, **så** blir svaret 400 med koden `invalid_input`.

#### API-kontraktet för funktionen

`GET /customers/me/orders/export?lang=sv|en`, där `lang` är valfri (standard `sv`) och skiftlägesokänslig.

| Status | När |
|---|---|
| 200 | CSV (UTF-8 med BOM), även när kunden saknar beställningar |
| 400 `invalid_input` | `lang` är tomt, förekommer flera gånger eller stöds inte |
| 401 `unauthorized` | `X-Customer-Id` saknas eller är ogiltig |

Felsvar är JSON. 403 och 404 förekommer inte. Se `docs/api.md`, avsnittet "Export som CSV".

#### ADR: beslutet

ADR 0001 (`docs/adr/0001-inget-totalpris-i-csv-export.md`): exporten innehåller antal och à-pris men **inget totalpris**. Totalpriset finns kvar via `GET /orders/:id/price`, och exporten blir oberoende av den äldre modulen.

#### Alternativ du valde bort, och varför

- **Anropa `calcPrice` per beställning:** en Python-process per beställning, cirka 140 ms styck (mätt), alltså ungefär 7 s för 50 beställningar. Alla fel maskeras dessutom som 404.
- **Räkna totalpriset i SQL eller TypeScript:** duplicerar prislogiken, vilket bryter mot `docs/standard.md`, och ger avvikande belopp, eftersom `price_calc.py` trunkerar i stället för att avrunda.
- **Bygga om `price_calc.py` för flera beställningar:** rätt riktning, men hör till Arbete 3 och kräver karakteriseringstester först.

#### Antaganden

- Inloggningen är förenklad till headern `X-Customer-Id`. Riktig autentisering ligger utanför uppgiften.
- Kunderna öppnar filen i Excel med svenska eller engelska regionsinställningar, därav `;` och decimalkomma för sv.
- Produktnamn är fri text från kunden. De översätts inte och kan innehålla vad som helst, därav citering och formelneutralisering.
- Alla belopp är i kronor, och tiden visas i Europe/Stockholm.
- Seed-datan är påhittad. Ingen kund- eller produktionsdata finns i repot.
