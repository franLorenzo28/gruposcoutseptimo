import english from "./public-en.json";
import portuguese from "./public-pt.json";
import type { PublicLanguage } from "./PublicLanguageContext";
import { publicOverrides } from "./public-overrides";

const catalogues: Record<Exclude<PublicLanguage, "es">, Record<string, string>> = {
  en: english,
  pt: portuguese,
};

export function normalizePublicCopy(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function translatePublicCopy(value: string, language: PublicLanguage): string {
  if (language === "es") return value;
  const source = normalizePublicCopy(value);
  const translated = publicOverrides[source]?.[language] || catalogues[language][source] || value;
  if (language === "pt") {
    return translated.replace(/\bgrupo Scout 7o\b/gi, "Grupo Scout Séptimo");
  }
  return translated
    .replace(/\b(?:Sculptism|sculptism)\b/g, (word) => word[0] === "S" ? "Scouting" : "scouting")
    .replace(/\b(?:Scout Seventh Group|Scout Group Seventh|Sout Group Seventh|Scouting Group Seventh)\b/g, "Grupo Scout Séptimo");
}
