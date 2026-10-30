# API

Alla anrop utom `POST /customers` och `/health` kräver headern `X-Customer-Id` med den inloggade kundens id. Det är en förenklad inloggning för övningen.

| Metod och sökväg | Beskrivning | Svar |
|---|---|---|
| `GET /health` | Kontroll att API:t kör. | 200 |
| `POST /customers` | Registrera en kund. Body: `{ name, email }`. | 201, 400 |
| `GET /customers/me` | Den inloggade kunden. | 200, 401, 404 |
| `GET /customers/me/orders` | Den inloggade kundens beställningar, nyast först. | 200, 401 |
| `GET /customers/me/orders/export` | Den inloggade kundens beställningar som CSV-fil på svenska eller engelska. Se nedan. | 200, 400, 401 |
| `POST /orders` | Lägg en beställning. Body: `{ lines: [{ product, quantity, unitPrice }], discountCode? }`. | 201, 400, 401 |
| `GET /orders/:id` | En egen beställning med rader. | 200, 400, 401, 403, 404 |
| `GET /orders/:id/price` | Pris för en egen beställning: `{ net, vat, total }`. Räknas av den äldre modulen. | 200, 400, 401, 403, 404 |

## Export som CSV

`GET /customers/me/orders/export` returnerar den inloggade kundens beställningar som en CSV-fil. Krav och beslut finns i `docs/features/export-csv.md`.

**Request**

| Del | Värde |
|---|---|
| Header | `X-Customer-Id` (obligatorisk) |
| Query | `lang`: `sv` eller `en`, valfri, standard `sv`. Skiftlägesokänslig. |

**Svar**

| Status | När | Body och headers |
|---|---|---|
| 200 | Lyckad export, även när kunden saknar beställningar | `Content-Type: text/csv; charset=utf-8`. `Content-Disposition: attachment; filename="bestallningar.csv"` (sv) eller `"orders.csv"` (en). Body: UTF-8 med BOM, rubrikrad och en rad per orderrad. |
| 400 | `lang` är tomt, förekommer flera gånger eller har ett värde som inte stöds | `{ "error": { "code": "invalid_input", "message": "lang måste vara sv eller en." } }` |
| 401 | `X-Customer-Id` saknas eller är ogiltig | `{ "error": { "code": "unauthorized", "message": "Logga in först." } }` |

403 och 404 förekommer inte, eftersom endpointen bara läser den inloggade kundens egna beställningar. Felsvar är JSON, inte CSV.

**Kolumner**

| sv | en | Källa | Format |
|---|---|---|---|
| Beställning | Order | `orders.id` | heltal |
| Datum | Date | `orders.created_at` | `YYYY-MM-DD`, Europe/Stockholm |
| Status | Status | `orders.status` | översatt |
| Produkt | Product | `order_lines.product` | oöversatt, citerat och neutraliserat vid behov |
| Antal | Quantity | `order_lines.quantity` | heltal |
| À-pris | Unit price | `order_lines.unit_price` | två decimaler, `,` (sv) eller `.` (en) |

Avgränsare: `;` (sv) eller `,` (en). Fält som innehåller avgränsaren, citattecken eller radbrytning citeras enligt RFC 4180. Fält som börjar med `=`, `+`, `-` eller `@` får ett `'` först.

## Den äldre modulen

`src/legacy/price_calc.py` räknar pris, rabatt och moms för en beställning. Den är skriven i Python, saknar tester och dokumentation och anropas från två ställen: API:t (via `src/pricing/legacyPrice.ts`) och den nattliga rapporten `jobs/nightly_report.py`.

Den går att köra direkt:

```bash
python3 src/legacy/price_calc.py 1042
```
