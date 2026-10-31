export type ExportLang = "sv" | "en";

export type ExportStrings = {
  headers: {
    order: string;
    date: string;
    status: string;
    product: string;
    quantity: string;
    unitPrice: string;
  };
  statuses: {
    new: string;
    paid: string;
    shipped: string;
    cancelled: string;
  };
  delimiter: string;
  decimalSeparator: string;
  filename: string;
};

export const exportStrings: Record<ExportLang, ExportStrings> = {
  sv: {
    headers: {
      // Kolumnrubrik i CSV-filen, första raden: beställningens nummer.
      order: "Beställning",
      // Kolumnrubrik i CSV-filen, första raden: datumet beställningen lades.
      date: "Datum",
      // Kolumnrubrik i CSV-filen, första raden: beställningens status.
      status: "Status",
      // Kolumnrubrik i CSV-filen, första raden: produktnamnet på orderraden.
      product: "Produkt",
      // Kolumnrubrik i CSV-filen, första raden: antal enheter på orderraden.
      quantity: "Antal",
      // Kolumnrubrik i CSV-filen, första raden: pris per enhet ("à-pris").
      unitPrice: "À-pris",
    },
    statuses: {
      // Statusvärde i kolumnen Status för beställningar med status `new`.
      new: "Ny",
      // Statusvärde i kolumnen Status för beställningar med status `paid`.
      paid: "Betald",
      // Statusvärde i kolumnen Status för beställningar med status `shipped`.
      shipped: "Skickad",
      // Statusvärde i kolumnen Status för beställningar med status `cancelled`.
      cancelled: "Avbruten",
    },
    // Tecken som skiljer fälten åt på varje rad i CSV-filen (semikolon i svensk Excel).
    delimiter: ";",
    // Decimaltecken i kolumnen À-pris, t.ex. 375,00 (komma i svensk Excel, ingen tusentalsavgränsare).
    decimalSeparator: ",",
    // Filnamn i Content-Disposition när användaren sparar exporten.
    filename: "bestallningar.csv",
  },
  en: {
    headers: {
      // Kolumnrubrik i CSV-filen, första raden: beställningens nummer.
      order: "Order",
      // Kolumnrubrik i CSV-filen, första raden: datumet beställningen lades.
      date: "Date",
      // Kolumnrubrik i CSV-filen, första raden: beställningens status.
      status: "Status",
      // Kolumnrubrik i CSV-filen, första raden: produktnamnet på orderraden.
      product: "Product",
      // Kolumnrubrik i CSV-filen, första raden: antal enheter på orderraden.
      quantity: "Quantity",
      // Kolumnrubrik i CSV-filen, första raden: pris per enhet.
      unitPrice: "Unit price",
    },
    statuses: {
      // Statusvärde i kolumnen Status för beställningar med status `new`.
      new: "New",
      // Statusvärde i kolumnen Status för beställningar med status `paid`.
      paid: "Paid",
      // Statusvärde i kolumnen Status för beställningar med status `shipped`.
      shipped: "Shipped",
      // Statusvärde i kolumnen Status för beställningar med status `cancelled`.
      cancelled: "Cancelled",
    },
    // Tecken som skiljer fälten åt på varje rad i CSV-filen (komma i engelsk Excel).
    delimiter: ",",
    // Decimaltecken i kolumnen Unit price, t.ex. 375.00 (punkt i engelsk Excel, ingen tusentalsavgränsare).
    decimalSeparator: ".",
    // Filnamn i Content-Disposition när användaren sparar exporten.
    filename: "orders.csv",
  },
};
