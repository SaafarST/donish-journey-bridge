import { useState } from "react";
import { Send } from "lucide-react";
import { MicrophoneInput } from "@/components/MicrophoneInput";
import { LanguageSelector, SourceLanguage } from "@/components/LanguageSelector";
import { TranslationResult } from "@/components/TranslationResult";
import { TranslationHistory } from "@/components/TranslationHistory";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      spanish: "Spanish",
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
      spanish: `Тарчумаи матн аз забони испанӣ: "${inputText}"`,
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
                <div className="flex items-center justify-center gap-4 mt-3 text-sm text-primary-foreground/80">
                  <span className="flex items-center gap-1">
                    🎤 Speech
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    💬 Text
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    🔊 Voice
                  </span>
                </div>
                <p className="text-xs text-primary-foreground/60 mt-2">
                  EN • ES • RU • CN → 🇹🇯 Tajik
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

              {/* Speech Features Banner */}
              <Card className="bg-gradient-to-r from-purple-100 via-blue-100 to-green-100 dark:from-purple-500/10 dark:via-blue-500/10 dark:to-green-500/10 border-2 border-primary/30">
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-2xl">🎤</span>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-white">Speak to Translate</p>
                        <p className="text-xs text-gray-700 dark:text-gray-300">Гуфтан → Матн</p>
                      </div>
                    </div>
                    <div className="text-3xl text-gray-600 dark:text-gray-400">→</div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-2xl">🔊</span>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-white">Listen in Tajik</p>
                        <p className="text-xs text-gray-700 dark:text-gray-300">Шунидани тарчума</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Microphone */}
              <div className="flex flex-col items-center gap-6">
                <MicrophoneInput
                  onTranscript={(text) => setInputText(text)}
                  isListening={isListening}
                  onToggle={handleToggleMic}
                />
                <div className="text-center space-y-2">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isListening ? "🎤 Listening..." : "Tap to Speak"}
                  </p>
                  <p className="text-base text-gray-800 dark:text-gray-200">
                    {isListening ? "Гап занед, мо мешунавем" : "Гап занед ва мо тарчума мекунем"}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    Speech → Text → Translation → 🔊 Voice
                  </p>
                </div>
              </div>

              {/* Text Input Alternative */}
              <div className="w-full max-w-2xl">
                <div className="text-center mb-3">
                  <p className="text-base font-medium text-gray-800 dark:text-gray-200">
                    💬 Or type your message
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type in any language... / Бо ягон забон нависед..."
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
