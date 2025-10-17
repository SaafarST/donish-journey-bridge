import { useState } from "react";
import { Send } from "lucide-react";
import { MicrophoneInput } from "@/components/MicrophoneInput";
import { PersonalitySelector, Personality } from "@/components/PersonalitySelector";
import { ProgressiveAnswer } from "@/components/ProgressiveAnswer";
import { KnowledgeJourney } from "@/components/KnowledgeJourney";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import pamirHero from "@/assets/pamir-hero.jpg";

const Index = () => {
  const [isListening, setIsListening] = useState(false);
  const [personality, setPersonality] = useState<Personality>("friend");
  const [inputText, setInputText] = useState("");
  const [hasAsked, setHasAsked] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [journeyNodes, setJourneyNodes] = useState<Array<{ id: string; question: string; isActive: boolean }>>([]);

  // Demo answer data - will be replaced with real AI in next iteration
  const demoAnswer = {
    levels: [
      {
        level: 1,
        title: "The Tweet (Core Answer)",
        content: "Inflation means your money buys less over time. Prices go up, purchasing power goes down."
      },
      {
        level: 2,
        title: "The Explanation",
        content: "Inflation happens when there's more money in circulation but the same amount of goods. Think of it like a crowded bazaar - when everyone has more money to spend but there's the same amount of bread, the baker raises prices because people will pay more."
      },
      {
        level: 3,
        title: "The Deep Dive",
        content: "In Tajikistan, inflation is influenced by several factors: import prices (especially from Russia and China), domestic agricultural production, energy costs, and the somoni exchange rate. The National Bank of Tajikistan manages monetary policy to keep inflation stable, targeting around 6% annually. Recent global events have impacted food and fuel prices significantly."
      },
      {
        level: 4,
        title: "The Sources",
        content: "For specific current data and deeper analysis, here are trusted sources that provide regular updates on Tajikistan's economic indicators and inflation trends."
      }
    ],
    sources: [
      { title: "National Bank of Tajikistan - Monetary Policy Reports", url: "https://www.nbt.tj" },
      { title: "Asian Development Bank - Tajikistan Economic Updates", url: "https://www.adb.org" },
      { title: "World Bank - Tajikistan Overview", url: "https://www.worldbank.org" }
    ]
  };

  const handleToggleMic = () => {
    if (!isListening) {
      toast.info("Voice input will be enabled with Lovable Cloud");
    }
    setIsListening(!isListening);
  };

  const handleAsk = () => {
    if (!inputText.trim()) {
      toast.error("Please ask a question");
      return;
    }

    setCurrentQuestion(inputText);
    setHasAsked(true);
    
    // Add to journey
    const newNode = {
      id: Date.now().toString(),
      question: inputText,
      isActive: true
    };
    
    setJourneyNodes(prev => [
      ...prev.map(n => ({ ...n, isActive: false })),
      newNode
    ]);
    
    // Clear input
    setInputText("");
    
    toast.success("Answer generated! Scroll to explore layers of understanding.");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleNodeClick = (id: string) => {
    setJourneyNodes(prev => prev.map(n => ({ ...n, isActive: n.id === id })));
    toast.info("Returning to this question...");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Background */}
      {!hasAsked && (
        <div 
          className="fixed inset-0 z-0 transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${pamirHero})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-primary/60 to-background" />
        </div>
      )}

      {/* Content */}
      <div className={`relative z-10 ${hasAsked ? "bg-background" : ""}`}>
        <div className="container max-w-4xl mx-auto px-6 py-12 min-h-screen flex flex-col">
          
          {!hasAsked ? (
            // Opening Experience
            <div className="flex-1 flex flex-col items-center justify-center space-y-12 text-center stagger-children">
              {/* Logo / Brand */}
              <div>
                <h1 className="text-hero gradient-text mb-4">
                  Дониш
                </h1>
                <p className="text-xl text-primary-foreground/80 font-light">
                  Ҳар савол - як саёҳат
                </p>
                <p className="text-sm text-primary-foreground/60 mt-2">
                  Every question is a journey
                </p>
              </div>

              {/* Main Question */}
              <div className="space-y-6">
                <h2 className="text-question text-primary-foreground drop-shadow-lg">
                  Дар бораи чӣ фикр мекунед?
                </h2>
                <p className="text-lg text-primary-foreground/70">
                  What's on your mind?
                </p>
              </div>

              {/* Microphone */}
              <div className="flex flex-col items-center gap-6">
                <MicrophoneInput
                  onTranscript={(text) => setInputText(text)}
                  isListening={isListening}
                  onToggle={handleToggleMic}
                />
                <p className="text-sm text-primary-foreground/60">
                  {isListening ? "Listening..." : "Tap to speak"}
                </p>
              </div>

              {/* Text Input Alternative */}
              <div className="w-full max-w-2xl">
                <div className="flex gap-3">
                  <Input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Or type your question..."
                    className="bg-card/80 backdrop-blur-sm border-2 border-primary/20 focus:border-accent text-lg h-14 shadow-lg"
                  />
                  <Button
                    onClick={handleAsk}
                    size="lg"
                    className="bg-gradient-to-br from-accent to-secondary hover:scale-105 transition-transform shadow-lg h-14 px-8"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Personality Selector */}
              <div className="space-y-4">
                <p className="text-sm text-primary-foreground/70">
                  Choose your guide:
                </p>
                <PersonalitySelector
                  selected={personality}
                  onSelect={setPersonality}
                />
              </div>
            </div>
          ) : (
            // Answer View
            <div className="space-y-8 py-8">
              {/* Header with Question */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold gradient-text mb-2">
                    Дониш
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Knowledge Discovery
                  </p>
                </div>

                <Card className="p-6 bg-gradient-to-br from-muted/50 to-card shadow-lg">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Your Question:
                  </div>
                  <h2 className="text-2xl font-bold text-primary">
                    {currentQuestion}
                  </h2>
                </Card>

                <PersonalitySelector
                  selected={personality}
                  onSelect={setPersonality}
                />
              </div>

              {/* Progressive Answer */}
              <ProgressiveAnswer
                levels={demoAnswer.levels}
                sources={demoAnswer.sources}
              />

              {/* Knowledge Journey */}
              {journeyNodes.length > 0 && (
                <KnowledgeJourney
                  nodes={journeyNodes}
                  onNodeClick={handleNodeClick}
                />
              )}

              {/* Ask Another Question */}
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 shadow-lg">
                <div className="flex gap-3">
                  <Input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask another question..."
                    className="text-lg h-12"
                  />
                  <Button
                    onClick={handleAsk}
                    size="lg"
                    className="bg-gradient-to-br from-primary to-primary-glow hover:scale-105 transition-transform h-12 px-8"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
