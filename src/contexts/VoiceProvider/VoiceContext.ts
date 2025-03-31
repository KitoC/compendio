import { createContext, useContext } from "react";

interface VoiceContextType {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  sendTranscript: () => void;
  hasSpoken: boolean;
}

export const VoiceContext = createContext<VoiceContextType | undefined>(
  undefined
);

export const useVoiceContext = () => {
  const ctx = useContext(VoiceContext);
  if (!ctx)
    throw new Error("useVoiceContext must be used inside a VoiceProvider");
  return ctx;
};
