import { createContext, useContext, useMemo, useState } from "react";

export type PublicLanguage = "es" | "pt" | "en";

const storageKey = "grupo7_public_language";
const PublicLanguageContext = createContext<{
  language: PublicLanguage;
  setLanguage: (language: PublicLanguage) => void;
} | null>(null);

function storedLanguage(): PublicLanguage {
  try {
    const value = window.localStorage.getItem(storageKey);
    return value === "pt" || value === "en" ? value : "es";
  } catch {
    return "es";
  }
}

export function PublicLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, updateLanguage] = useState<PublicLanguage>(storedLanguage);
  const value = useMemo(() => ({
    language,
    setLanguage: (next: PublicLanguage) => {
      updateLanguage(next);
      try { window.localStorage.setItem(storageKey, next); } catch { /* Storage can be unavailable. */ }
    },
  }), [language]);

  return <PublicLanguageContext.Provider value={value}>{children}</PublicLanguageContext.Provider>;
}

export function usePublicLanguage() {
  const context = useContext(PublicLanguageContext);
  if (!context) throw new Error("PublicLanguageProvider is missing");
  return context;
}
