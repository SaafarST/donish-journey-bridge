import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TranslationResultProps {
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
}

export const TranslationResult = ({ 
  sourceText, 
  translatedText, 
  sourceLanguage 
}: TranslationResultProps) => {
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translatedText);
      setCopied(true);
      toast.success("Translation copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy translation");
    }
  };

  const handleSpeak = () => {
    // Text-to-speech simulation
    setIsPlaying(true);
    toast.success("🔊 Listening to Tajik translation...", {
      description: "Voice output coming soon!"
    });
    setTimeout(() => setIsPlaying(false), 2000);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Source Text */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Original ({sourceLanguage})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed">{sourceText}</p>
        </CardContent>
      </Card>

      {/* Translated Text */}
      <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-950 dark:via-blue-950 dark:to-indigo-950 border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <span className="text-3xl">🇹🇯</span>
            Translation (Tajik)
            <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg leading-relaxed font-medium whitespace-pre-wrap">
            {translatedText}
          </p>
          
          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleSpeak}
              variant={isPlaying ? "default" : "secondary"}
              size="lg"
              disabled={isPlaying}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
            >
              <Volume2 className={`w-6 h-6 mr-3 ${isPlaying ? 'animate-pulse' : ''}`} />
              <div className="flex flex-col items-start">
                <span className="font-semibold">🔊 Listen in Tajik</span>
                <span className="text-xs opacity-90">Шунидани тарчума</span>
              </div>
            </Button>
            
            <div className="flex gap-2">
              <Button
                onClick={handleCopy}
                variant={copied ? "default" : "outline"}
                size="lg"
                className="flex-1"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 mr-2" />
                    Copy Text
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
