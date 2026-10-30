# Export av beställningar som CSV (user story #8, utökad med sv/en)

## User story

Som kund vill jag kunna ladda ner mina beställningar som en CSV-fil på svenska eller engelska, så att jag kan öppna dem i Excel med rätt språk och format för min region.

Grund: user story #8 i `docs/user-stories.md`. Språkstödet för sv och en är en medveten utökning.

## Avgränsning

**Ingår**

- Alla den inloggade kundens egna beställningar, med orderrader.
- Språken sv och en.
- Kolumnrubriker och statusvärden översätts.
- Datum, decimaltecken och avgränsare följer språket.

**Ingår inte**

- Beräknat totalpris (se B5).
- Översättning av produktnamn (se Bortvalt).
- Fler språk än sv och en (nästa steg).
- Filtrering.

## Beslut

Beslutade av Jon Laprevote 2026-10-30.

| # | Fråga | Beslut | Motivering |
|---|---|---|---|
| B1 | En rad per beställning eller per orderrad? | Per orderrad. En beställning utan rader blir en rad med tomma produktfält. | Mer användbar fil, och produktnamnen med å/ä/ö kommer med. Beställning 1043 saknar rader och blir ett gränsfall. |
| B2 | Hur väljs språket? | `?lang=sv` eller `?lang=en`, med sv som standard. Ett språk som inte stöds ger 400. | Explicit och lätt att testa. 400 följer `docs/standard.md` för ogiltig indata. `Accept-Language` och fallback kan bli nästa steg. |
| B3 | Datumformat? | ISO `2026-10-01` för båda språken, i tidszonen Europe/Stockholm. | Entydigt. `10/01/2026` betyder olika saker i USA och Storbritannien. Tidszonen spelar roll för beställningar nära midnatt. |
| B4 | Talformat? | sv: `375,00` med `;` som avgränsare. en: `375.00` med `,`. Ingen tusentalsavgränsare. | Excel med svenska inställningar läser `;` och decimalkomma. Utan tusentalsavgränsare undviks problem med osynliga mellanslag. |
| B5 | Totalpris med? | Nej, bara antal och à-pris. | Totalpriset räknas i `price_calc.py`, och `docs/standard.md` kräver att all prisberäkning går via `calcPrice`. Det skulle ge en Python-process per beställning. |
| B6 | CSV-injektion? | Neutralisera. Fält som börjar med `=`, `+`, `-` eller `@` får ett `'` först. | Produktnamnet skickas in av kunden. Ett namn som `=HYPERLINK(…)` körs som formel när filen öppnas i Excel. |

## Bortvalt

- **Översättning av produktnamn.** Produktnamnen är kunddata: fri text i `order_lines.product`, som kunden skickar in vid `POST /orders`. Det finns ingen produktkatalog att hämta översättningar från.
  - Maskinöversättning vid exporten: osäker för fritext, kan ge olika resultat vid två exporter, kostar ett anrop per rad och granskas inte av någon människa.
  - Produktkatalog med översättningar: kräver nya tabeller, migreringar och ändrad `POST /orders`. Det är en egen user story.
  - Exporten ska stämma med det kunden faktiskt beställde. Man lokaliserar det systemet äger, inte innehåll som användaren skapat.

## Acceptanskriterier

Testdata från `db/seed.sql`: kund 1 har beställningarna 1040 (1 rad) och 1042 (2 rader). Kund 7 har inga beställningar.

### Lyckat fall

1. **Givet** att kund 1 är inloggad, **när** kunden hämtar `GET /customers/me/orders/export?lang=sv`, **så** blir svaret 200 med `Content-Type: text/csv; charset=utf-8`, en nedladdningsrubrik med filnamnet `bestallningar.csv`, en rubrikrad och tre datarader.
2. **Givet** `lang=sv`, **så** är rubrikraden `Beställning;Datum;Status;Produkt;Antal;À-pris`.
3. **Givet** `lang=en`, **så** är rubrikraden `Order,Date,Status,Product,Quantity,Unit price` och filnamnet `orders.csv`.
4. **Givet** beställning 1042 med status `paid`, **så** står statusen som `Betald` med sv och `Paid` med en. Detsamma gäller `new`, `shipped` och `cancelled`.
5. **Givet** à-priset 375.00, **så** står det `375,00` med sv och `375.00` med en.
6. **Givet** beställning 1042, skapad 2026-10-01 09:05 svensk tid, **så** står datumet `2026-10-01` i båda språken.
7. **Givet** att `lang` saknas, **så** blir filen på svenska.
8. **Givet** kund 1, **så** står beställningarna nyast först och orderraderna i den ordning de lades till.

### Format och specialtecken

9. **Givet** valfri export, **så** börjar filen med UTF-8 BOM, och `Hörlurar` och `Skrivbordslampa` visas oförändrade.
10. **Givet** ett produktnamn som innehåller avgränsaren, citattecken eller radbrytning, **så** omges fältet av citattecken, och inre citattecken dubbleras enligt RFC 4180.
11. **Givet** ett produktnamn som börjar med `=`, `+`, `-` eller `@`, **så** får fältet ett `'` först och tolkas inte som en formel.

### Fel- och gränsfall

12. **Givet** `lang=de`, **så** blir svaret 400 med `{ "error": { "code": "invalid_input", ... } }`.
13. **Givet** att headern `X-Customer-Id` saknas, **så** blir svaret 401.
14. **Givet** kund 1, **så** innehåller filen inte beställning 1041, som tillhör kund 2.
15. **Givet** kund 7 utan beställningar, **så** blir svaret 200 med bara rubrikraden.

## Kvar att bestämma

- API-kontraktet: endpoint, parametrar och statuskoder. `GET /customers/me/orders/export` är ett förslag.
- ADR 0001 för det viktigaste beslutet.
