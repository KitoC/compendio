import { useEffect, useRef, useState, useCallback } from "react";
import { VoiceContext } from "./VoiceContext";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { useTTS } from "../TTSProvider";
import { useDebounce } from "use-debounce";

const HOTWORDS = ["hey billy", "hey", "stop", "actually"]; // 🔥 Add more here

function endsWithFiller(text: string) {
  return /\b(um+|uh+|err+)\b[\s.,!?]*$/i.test(text.trim());
}

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [hasSpoken, setHasSpoken] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const { stop: stopTTS, isPlaying } = useTTS();

  const {
    transcript,
    interimTranscript,
    resetTranscript,
    listening,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const lastTranscriptRef = useRef("");
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fullTranscript = `${transcript} ${interimTranscript}`.trim();
  const [debouncedTranscript] = useDebounce(fullTranscript, 800);

  const startListening = () => {
    SpeechRecognition.startListening({ continuous: true, language: "en-AU" });
    setIsActive(true);
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
    setIsActive(false);
  };

  const sendTranscript = useCallback(() => {
    const final = transcript.trim();
    if (final.length > 0) {
      // 👉 Send this to your chat system
      resetTranscript();
      lastTranscriptRef.current = "";
      setHasSpoken(false);
    }
  }, [transcript, resetTranscript]);

  useEffect(() => {
    if (!listening || !interimTranscript || !isActive) return;

    const lower =
      `${lastTranscriptRef.current} ${interimTranscript}`.toLowerCase();

    for (const hotword of HOTWORDS) {
      if (lower.includes(hotword)) {
        stopTTS(); // Interrupt speech
        resetTranscript(); // Clean buffer
        return;
      }
    }
  }, [interimTranscript, listening, isActive, stopTTS, resetTranscript]);

  // 🧠 Debounced detection of pauses and send trigger (only when not playing)
  useEffect(() => {
    if (!listening || !isActive || isPlaying) return;

    const cleaned = debouncedTranscript.trim();

    if (cleaned.length > 0 && cleaned !== lastTranscriptRef.current.trim()) {
      if (endsWithFiller(cleaned)) {
        return;
      }

      lastTranscriptRef.current = cleaned;
      setHasSpoken(true);

      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = setTimeout(() => {
        sendTranscript();
      }, 2500);
    }
  }, [debouncedTranscript, isActive, listening, sendTranscript, isPlaying]);

  return (
    <VoiceContext.Provider
      value={{
        isListening: listening,
        transcript: !isPlaying ? transcript : "",
        interimTranscript: !isPlaying ? interimTranscript : "",
        startListening,
        stopListening,
        sendTranscript,
        hasSpoken,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};
