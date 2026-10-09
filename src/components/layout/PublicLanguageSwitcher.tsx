import { Check, ChevronDown, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePublicLanguage, type PublicLanguage } from "@/i18n/PublicLanguageContext";

const languages: { code: PublicLanguage; name: string; short: string }[] = [
  { code: "es", name: "Español", short: "ES" },
  { code: "pt", name: "Português", short: "PT" },
  { code: "en", name: "English", short: "EN" },
];

export default function PublicLanguageSwitcher() {
  const { language, setLanguage } = usePublicLanguage();
  const selected = languages.find((entry) => entry.code === language)!;
  const accessibleLabel = language === "pt" ? "Idioma do site" : language === "en" ? "Site language" : "Idioma del sitio";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button data-no-translate type="button" variant="outline" size="sm" className="h-10 gap-1.5 rounded-xl px-2.5" aria-label={`${accessibleLabel}: ${selected.name}`}>
          <Languages className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs font-bold">{selected.short}</span>
          <ChevronDown className="h-3 w-3 opacity-60" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent data-no-translate align="end" className="min-w-40 rounded-xl p-1.5">
        {languages.map((entry) => (
          <DropdownMenuItem key={entry.code} lang={entry.code} onSelect={() => setLanguage(entry.code)} className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5">
            <span>{entry.name}</span>
            {language === entry.code && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
