import { neutralizeFormula } from "../src/csv";
import { exportStrings, type ExportLang } from "../src/i18n/exportStrings";

// Rubrikraden går inte genom escapeField eller neutralizeFormula. Därför får ingen rubrik
// eller statustext innehålla något som kräver citering, och ingen får börja med ett formeltecken.
// Båda avgränsarna kontrolleras i båda språken, eftersom en text kan flyttas mellan språk.
const forbiddenCharacters = [";", ",", '"', "\r", "\n"];

const textsFor = (lang: ExportLang): [string, string][] => {
  const strings = exportStrings[lang];
  return [
    ...Object.entries(strings.headers).map(([key, text]): [string, string] => [
      `headers.${key}`,
      text,
    ]),
    ...Object.entries(strings.statuses).map(([key, text]): [string, string] => [
      `statuses.${key}`,
      text,
    ]),
  ];
};

describe("exportStrings", () => {
  it.each<ExportLang>(["sv", "en"])(
    "har rubriker och statustexter utan tecken som kräver citering eller formelneutralisering med lang=%s",
    (lang) => {
      const texts = textsFor(lang);
      expect(texts).toHaveLength(10);

      const withForbiddenCharacter = texts
        .filter(([, text]) => forbiddenCharacters.some((char) => text.includes(char)))
        .map(([key]) => key);
      expect(withForbiddenCharacter).toEqual([]);

      const startingWithFormulaCharacter = texts
        .filter(([, text]) => neutralizeFormula(text) !== text)
        .map(([key]) => key);
      expect(startingWithFormulaCharacter).toEqual([]);
    },
  );
});
