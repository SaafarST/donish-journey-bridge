import { Mic, MicOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface MicrophoneInputProps {
  onTranscript: (text: string) => void;
  isListening: boolean;
  onToggle: () => void;
}

export const MicrophoneInput = ({ onTranscript, isListening, onToggle }: MicrophoneInputProps) => {
  return (
    <div className="relative">
      <Button
        onClick={onToggle}
        size="lg"
        className={`
          relative w-24 h-24 rounded-full transition-all duration-500
          ${isListening 
            ? "bg-gradient-to-br from-accent to-secondary shadow-[0_0_40px_hsl(var(--accent)/0.5)] scale-110" 
            : "bg-gradient-to-br from-primary to-primary-glow shadow-[0_20px_60px_-10px_hsl(var(--primary)/0.3)] hover:scale-105"
          }
        `}
      >
        {isListening ? (
          <MicOff className="w-10 h-10 text-primary-foreground animate-pulse-glow" />
        ) : (
          <Mic className="w-10 h-10 text-primary-foreground" />
        )}
      </Button>
      
      {isListening && (
        <div className="absolute inset-0 rounded-full border-4 border-accent animate-ping opacity-75" />
      )}
    </div>
  );
};
