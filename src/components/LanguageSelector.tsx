import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type SourceLanguage = "english" | "russian" | "chinese" | "spanish";

interface LanguageSelectorProps {
  selected: SourceLanguage;
  onSelect: (language: SourceLanguage) => void;
}

const languages = [
  { 
    id: "english" as const, 
    label: "English",
    nativeLabel: "English",
    flag: "🇬🇧",
    gradient: "from-blue-500 to-red-500"
  },
  { 
    id: "spanish" as const, 
    label: "Spanish",
    nativeLabel: "Español",
    flag: "🇪🇸",
    gradient: "from-red-600 to-yellow-400"
  },
  { 
    id: "russian" as const, 
    label: "Russian",
    nativeLabel: "Русский",
    flag: "🇷🇺",
    gradient: "from-blue-600 to-red-600"
  },
  { 
    id: "chinese" as const, 
    label: "Chinese",
    nativeLabel: "中文",
    flag: "🇨🇳",
    gradient: "from-red-600 to-yellow-500"
  }
];

export const LanguageSelector = ({ selected, onSelect }: LanguageSelectorProps) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-sm text-muted-foreground font-medium">
        Translate from:
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {languages.map((lang) => (
          <Button
            key={lang.id}
            onClick={() => onSelect(lang.id)}
            variant={selected === lang.id ? "default" : "outline"}
            size="lg"
            className={`
              relative overflow-hidden transition-all duration-300
              ${selected === lang.id 
                ? `bg-gradient-to-r ${lang.gradient} text-white shadow-lg scale-105` 
                : "hover:scale-105"
              }
            `}
          >
            <span className="text-2xl mr-2">{lang.flag}</span>
            <div className="flex flex-col items-start">
              <span className="font-semibold">{lang.label}</span>
              <span className="text-xs opacity-80">{lang.nativeLabel}</span>
            </div>
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-primary">
        <div className="text-2xl">→</div>
        <Card className="px-4 py-2 bg-gradient-to-r from-primary to-primary-glow">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🇹🇯</span>
            <div className="flex flex-col">
              <span className="font-semibold text-primary-foreground">Tajik</span>
              <span className="text-xs text-primary-foreground/80">Тоҷикӣ</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
