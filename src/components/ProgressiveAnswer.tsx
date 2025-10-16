import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AnswerLevel {
  level: number;
  title: string;
  content: string;
}

interface ProgressiveAnswerProps {
  levels: AnswerLevel[];
  sources?: Array<{ title: string; url: string }>;
}

export const ProgressiveAnswer = ({ levels, sources }: ProgressiveAnswerProps) => {
  const [expandedLevel, setExpandedLevel] = useState(1);

  const toggleLevel = (level: number) => {
    setExpandedLevel(expandedLevel === level ? level - 1 : level);
  };

  return (
    <div className="space-y-6 stagger-children">
      {levels.map((levelData, index) => {
        const isExpanded = expandedLevel >= levelData.level;
        const isCurrentLevel = expandedLevel === levelData.level - 1;
        
        return (
          <div key={levelData.level}>
            {isExpanded && (
              <Card className={`
                p-8 transition-all duration-500 animate-fade-in-up
                ${levelData.level === 1 
                  ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-[0_20px_60px_-10px_hsl(var(--primary)/0.4)]" 
                  : "bg-card shadow-[0_4px_24px_-4px_hsl(var(--primary)/0.15)]"
                }
              `}>
                <div className="mb-3 text-sm font-medium opacity-70">
                  {levelData.title}
                </div>
                <div className={`
                  ${levelData.level === 1 ? "text-answer" : "text-xl leading-relaxed"}
                `}>
                  {levelData.content}
                </div>
              </Card>
            )}
            
            {isCurrentLevel && index < levels.length - 1 && (
              <div className="flex justify-center mt-6 animate-pulse-glow">
                <Button
                  onClick={() => toggleLevel(levelData.level + 1)}
                  variant="outline"
                  size="lg"
                  className="group bg-card hover:bg-gradient-to-r hover:from-accent hover:to-secondary hover:text-primary-foreground border-2 border-primary/20 hover:border-transparent transition-all duration-300 shadow-[0_4px_24px_-4px_hsl(var(--primary)/0.1)]"
                >
                  <span className="text-lg font-medium">Want to know more?</span>
                  <ChevronDown className="ml-2 w-5 h-5 group-hover:animate-bounce" />
                </Button>
              </div>
            )}
          </div>
        );
      })}

      {sources && sources.length > 0 && expandedLevel >= levels.length && (
        <Card className="p-6 bg-muted/50 animate-fade-in-up">
          <div className="text-sm font-bold mb-4 text-muted-foreground">Sources:</div>
          <div className="space-y-2">
            {sources.map((source, idx) => (
              <a
                key={idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:text-accent transition-colors group"
              >
                <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="group-hover:underline">{source.title}</span>
              </a>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
