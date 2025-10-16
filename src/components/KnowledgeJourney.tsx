import { ArrowRight, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface JourneyNode {
  id: string;
  question: string;
  isActive: boolean;
}

interface KnowledgeJourneyProps {
  nodes: JourneyNode[];
  onNodeClick: (id: string) => void;
}

export const KnowledgeJourney = ({ nodes, onNodeClick }: KnowledgeJourneyProps) => {
  if (nodes.length === 0) return null;

  return (
    <Card className="p-6 bg-gradient-to-br from-muted/50 to-card shadow-[0_4px_24px_-4px_hsl(var(--primary)/0.1)]">
      <div className="text-sm font-bold mb-4 text-muted-foreground">
        Your Journey Today:
      </div>
      
      <div className="space-y-3">
        {nodes.map((node, index) => (
          <div key={node.id} className="flex items-center gap-3">
            <button
              onClick={() => onNodeClick(node.id)}
              className={`
                flex items-center gap-3 flex-1 text-left p-3 rounded-lg transition-all duration-300
                ${node.isActive 
                  ? "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.3)]" 
                  : "bg-card hover:bg-muted"
                }
              `}
            >
              <Circle className={`w-4 h-4 ${node.isActive ? "fill-current" : ""}`} />
              <span className="font-medium">{node.question}</span>
            </button>
            
            {index < nodes.length - 1 && (
              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        ))}
        
        <div className="flex items-center gap-3 mt-4 text-muted-foreground">
          <Circle className="w-4 h-4" />
          <span className="text-sm italic">Where next?</span>
        </div>
      </div>
    </Card>
  );
};
