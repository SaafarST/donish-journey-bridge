import { useState } from "react";
import { Send } from "lucide-react";
import { MicrophoneInput } from "@/components/MicrophoneInput";
import { LanguageSelector, SourceLanguage } from "@/components/LanguageSelector";
import { TranslationResult } from "@/components/TranslationResult";
import { TranslationHistory } from "@/components/TranslationHistory";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import pamirHero from "@/assets/pamir-hero.jpg";

const Index = () => {
  const [isListening, setIsListening] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState<SourceLanguage>("english");
  const [inputText, setInputText] = useState("");
  const [hasTranslated, setHasTranslated] = useState(false);
  const [currentTranslation, setCurrentTranslation] = useState({
    sourceText: "",
    translatedText: "",
    sourceLanguage: ""
  });
  const [translationHistory, setTranslationHistory] = useState<Array<{
    id: string;
    sourceText: string;
    translatedText: string;
    sourceLanguage: string;
    timestamp: number;
    isActive: boolean;
  }>>([]);

  // Demo translation - will be replaced with real translation API
  const getLanguageLabel = (lang: SourceLanguage) => {
    const labels = {
      english: "English",
      russian: "Russian",
      chinese: "Chinese"
    };
    return labels[lang];
  };

  const handleToggleMic = () => {
    if (!isListening) {
      toast.info("Voice input will be enabled with backend integration");
    }
    setIsListening(!isListening);
  };

  const handleTranslate = () => {
    if (!inputText.trim()) {
      toast.error("Please enter text to translate");
      return;
    }

    // Demo translation - will be replaced with real API
    const demoTranslations: Record<SourceLanguage, string> = {
      english: `Тарчумаи матн аз забони англисӣ: "${inputText}"`,
      russian: `Тарчумаи матн аз забони русӣ: "${inputText}"`,
      chinese: `Тарчумаи матн аз забони хитоӣ: "${inputText}"`
    };

    const translation = {
      sourceText: inputText,
      translatedText: demoTranslations[sourceLanguage],
      sourceLanguage: getLanguageLabel(sourceLanguage)
    };

    setCurrentTranslation(translation);
    setHasTranslated(true);
    
    // Add to history
    const newItem = {
      id: Date.now().toString(),
      ...translation,
      timestamp: Date.now(),
      isActive: true
    };
    
    setTranslationHistory(prev => [
      ...prev.map(n => ({ ...n, isActive: false })),
      newItem
    ]);
    
    // Clear input
    setInputText("");
    
    toast.success("Translation complete!");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTranslate();
    }
  };

  const handleHistoryClick = (id: string) => {
    const item = translationHistory.find(t => t.id === id);
    if (item) {
      setCurrentTranslation({
        sourceText: item.sourceText,
        translatedText: item.translatedText,
        sourceLanguage: item.sourceLanguage
      });
      setTranslationHistory(prev => prev.map(n => ({ ...n, isActive: n.id === id })));
      toast.info("Viewing previous translation");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Background */}
      {!hasTranslated && (
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
      <div className={`relative z-10 ${hasTranslated ? "bg-background" : ""}`}>
        <div className="container max-w-4xl mx-auto px-6 py-12 min-h-screen flex flex-col">
          
          {!hasTranslated ? (
            // Opening Experience
            <div className="flex-1 flex flex-col items-center justify-center space-y-12 text-center stagger-children">
              {/* Logo / Brand */}
              <div>
                <h1 className="text-hero gradient-text mb-4">
                  Дониш
                </h1>
                <p className="text-xl text-primary-foreground/80 font-light">
                  Тарчумон - Your Language Bridge
                </p>
                <p className="text-sm text-primary-foreground/60 mt-2">
                  English • Russian • Chinese → Tajik
                </p>
              </div>

              {/* Main Question */}
              <div className="space-y-6">
                <h2 className="text-question text-primary-foreground drop-shadow-lg">
                  Чӣ тарчума кунем?
                </h2>
                <p className="text-lg text-primary-foreground/70">
                  What would you like to translate?
                </p>
              </div>

              {/* Language Selector */}
              <LanguageSelector
                selected={sourceLanguage}
                onSelect={setSourceLanguage}
              />

              {/* Microphone */}
              <div className="flex flex-col items-center gap-6">
                <MicrophoneInput
                  onTranscript={(text) => setInputText(text)}
                  isListening={isListening}
                  onToggle={handleToggleMic}
                />
                <p className="text-sm text-primary-foreground/60">
                  {isListening ? "Гап занед... (Speak)" : "Барои гап задан пахш кунед (Tap to speak)"}
                </p>
              </div>

              {/* Text Input */}
              <div className="w-full max-w-2xl">
                <div className="flex flex-col gap-3">
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Or type to translate... / Ё барои тарчума нависед..."
                    className="bg-card/80 backdrop-blur-sm border-2 border-primary/20 focus:border-accent text-lg min-h-[120px] shadow-lg resize-none"
                  />
                  <Button
                    onClick={handleTranslate}
                    size="lg"
                    className="bg-gradient-to-br from-accent to-secondary hover:scale-105 transition-transform shadow-lg h-14"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    Translate / Тарчума кунед
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Translation View
            <div className="space-y-8 py-8">
              {/* Header */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold gradient-text mb-2">
                    Дониш - Тарчумон
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Your Language Bridge to Tajik
                  </p>
                </div>

                <LanguageSelector
                  selected={sourceLanguage}
                  onSelect={setSourceLanguage}
                />
              </div>

              {/* Translation Result */}
              <TranslationResult
                sourceText={currentTranslation.sourceText}
                translatedText={currentTranslation.translatedText}
                sourceLanguage={currentTranslation.sourceLanguage}
              />

              {/* Translation History */}
              {translationHistory.length > 0 && (
                <TranslationHistory
                  items={translationHistory}
                  onItemClick={handleHistoryClick}
                />
              )}

              {/* Translate Another */}
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 shadow-lg">
                <div className="flex flex-col gap-3">
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Translate another text... / Матни дигареро тарчума кунед..."
                    className="text-lg min-h-[100px] resize-none"
                  />
                  <Button
                    onClick={handleTranslate}
                    size="lg"
                    className="bg-gradient-to-br from-primary to-primary-glow hover:scale-105 transition-transform h-12"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    Translate / Тарчума
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
