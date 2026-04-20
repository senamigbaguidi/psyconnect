import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LANGS = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "fon", label: "Fɔngbè" },
  { code: "gun", label: "Gungbè" },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  return (
    <Select value={i18n.language.split("-")[0]} onValueChange={(v) => i18n.changeLanguage(v)}>
      <SelectTrigger className="w-[130px] h-9 bg-card/60 backdrop-blur border-border">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGS.map((l) => (
          <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}