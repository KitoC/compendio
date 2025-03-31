import { createContext, useContext } from "react";
import { SentenceChunk } from "../chat/getGroupedSentences";

export interface TTSContextType {
  isPlaying: boolean;
  currentIndex: number | null;
  playQueue: (chunks: SentenceChunk[]) => void;
  stop: () => void;
  reset: () => void;
}

export const TTSContext = createContext<TTSContextType | undefined>(undefined);

export const useTTS = () => {
  const context = useContext(TTSContext);
  if (!context) {
    throw new Error("useTTS must be used within a TTSProvider");
  }
  return context;
};
