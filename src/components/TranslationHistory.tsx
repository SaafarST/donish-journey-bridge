import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, RotateCcw } from "lucide-react";

interface TranslationItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  timestamp: number;
  isActive: boolean;
}

interface TranslationHistoryProps {
  items: TranslationItem[];
  onItemClick: (id: string) => void;
}

export const TranslationHistory = ({ items, onItemClick }: TranslationHistoryProps) => {
  if (items.length === 0) return null;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="bg-gradient-to-br from-muted/50 to-card shadow-lg">
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Recent Translations</h3>
        </div>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((item) => (
            <Button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              variant={item.isActive ? "secondary" : "ghost"}
              className="w-full justify-start text-left h-auto py-3 px-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">
                    {item.sourceLanguage} → Tajik
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(item.timestamp)}
                  </span>
                </div>
                <p className="text-sm truncate">{item.sourceText}</p>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  → {item.translatedText}
                </p>
              </div>
              {item.isActive && (
                <RotateCcw className="w-4 h-4 ml-2 flex-shrink-0" />
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
