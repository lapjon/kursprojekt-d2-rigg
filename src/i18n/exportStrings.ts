export type ExportLang = "sv";

export type ExportStrings = {
  headers: {
    order: string;
    date: string;
    status: string;
    product: string;
    quantity: string;
    unitPrice: string;
  };
  delimiter: string;
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
    // Tecken som skiljer fälten åt på varje rad i CSV-filen (semikolon i svensk Excel).
    delimiter: ";",
    // Filnamn i Content-Disposition när användaren sparar exporten.
    filename: "bestallningar.csv",
  },
};
