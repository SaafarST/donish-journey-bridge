import { BookOpen, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Personality = "teacher" | "friend" | "grandfather";

interface PersonalitySelectorProps {
  selected: Personality;
  onSelect: (personality: Personality) => void;
}

export const PersonalitySelector = ({ selected, onSelect }: PersonalitySelectorProps) => {
  const personalities = [
    { 
      id: "teacher" as Personality, 
      label: "Устод", 
      sublabel: "Teacher",
      icon: BookOpen,
      description: "Formal, academic, detailed"
    },
    { 
      id: "friend" as Personality, 
      label: "Дӯст", 
      sublabel: "Friend",
      icon: Heart,
      description: "Conversational, warm"
    },
    { 
      id: "grandfather" as Personality, 
      label: "Бобо", 
      sublabel: "Grandfather",
      icon: Sparkles,
      description: "Stories, wisdom, proverbs"
    },
  ];

  return (
    <div className="flex gap-3 justify-center flex-wrap">
      {personalities.map(({ id, label, sublabel, icon: Icon, description }) => (
        <Button
          key={id}
          onClick={() => onSelect(id)}
          variant="outline"
          className={`
            flex flex-col items-center gap-2 h-auto py-4 px-6 transition-all duration-300
            ${selected === id 
              ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground border-transparent shadow-[0_0_30px_hsl(var(--primary)/0.3)]" 
              : "bg-card hover:bg-muted border-border hover:border-primary/30"
            }
          `}
        >
          <Icon className={`w-6 h-6 ${selected === id ? "animate-pulse-glow" : ""}`} />
          <div className="text-center">
            <div className="font-bold text-lg">{label}</div>
            <div className={`text-xs ${selected === id ? "opacity-90" : "opacity-60"}`}>
              {sublabel}
            </div>
            <div className={`text-xs mt-1 ${selected === id ? "opacity-80" : "opacity-50"}`}>
              {description}
            </div>
          </div>
        </Button>
      ))}
    </div>
  );
};
