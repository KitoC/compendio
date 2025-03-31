import { useRef, useState, useCallback } from "react";
import { Howl } from "howler";
import { SentenceChunk } from "@/contexts/chat/getGroupedSentences";
import { callSupabaseFunction } from "@/services/supabaseFunctionServices";

function stripMarkdown(md: string): string {
  return md
    .replace(/[_*~`>]+/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function stripEmojis(text: string): string {
  const emojiRegex =
    /[\p{Emoji_Presentation}\p{Emoji}\p{Extended_Pictographic}]/gu;
  return text.replace(emojiRegex, "").trim();
}

async function fetchTTS(text: string): Promise<string | null> {
  const cleaned = stripMarkdown(stripEmojis(text));
  const res = await callSupabaseFunction("tts", { message: cleaned });
  if (!res.ok) {
    console.error("TTS request failed:", await res.text());
    return null;
  }
  const json = await res.json();
  return json.audioContent;
}

export function useTTSPlayback() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  const queueRef = useRef<SentenceChunk[]>([]);
  const audioMap = useRef<Record<string, Howl>>({});
  const playedIds = useRef<Set<string>>(new Set());
  const isRunning = useRef(false);
  const lastIndexRef = useRef<number>(-1);

  const preload = useCallback(async (chunks: SentenceChunk[]) => {
    for (const chunk of chunks) {
      if (!audioMap.current[chunk.id]) {
        const base64 = await fetchTTS(chunk.text);
        if (!base64) continue;

        audioMap.current[chunk.id] = new Howl({
          src: [`data:audio/wav;base64,${base64}`],
          format: ["wav"],
          preload: true,
        });
      }
    }
  }, []);

  const playNext = useCallback(async (index: number) => {
    const chunks = queueRef.current;
    const chunk = chunks[index];

    if (!chunk) {
      setCurrentIndex(null);
      setIsPlaying(false);
      isRunning.current = false;
      return;
    }

    if (playedIds.current.has(chunk.id)) {
      playNext(index + 1); // Skip already played
      return;
    }

    const sound = audioMap.current[chunk.id];
    if (!sound) {
      console.warn("Missing audio for chunk", chunk.id);
      playNext(index + 1);
      return;
    }

    setCurrentIndex(index);
    setIsPlaying(true);
    isRunning.current = true;
    lastIndexRef.current = index;

    playedIds.current.add(chunk.id);

    sound.once("end", async () => {
      if (chunk.isParagraphBreak) {
        await new Promise((res) => setTimeout(res, 350));
      }
      playNext(index + 1);
    });

    sound.play();
  }, []);

  const playQueue = useCallback(
    async (newChunks: SentenceChunk[]) => {
      // Merge in any new chunks that haven't been seen before
      const existingIds = new Set(queueRef.current.map((c) => c.id));
      const additions = newChunks.filter((c) => !existingIds.has(c.id));

      if (additions.length > 0) {
        queueRef.current = [...queueRef.current, ...additions];
        await preload(additions);
      }

      // Only start playing if we aren’t already
      if (!isRunning.current) {
        playNext(lastIndexRef.current + 1);
      }
    },
    [preload, playNext]
  );

  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(null);
    isRunning.current = false;
    lastIndexRef.current = -1;

    Object.values(audioMap.current).forEach((sound) => {
      if (sound.playing()) sound.stop();
    });
  }, []);

  const reset = useCallback(() => {
    stop();
    queueRef.current = [];
    playedIds.current.clear();
    audioMap.current = {};
  }, [stop]);

  return {
    isPlaying,
    currentIndex,
    playQueue,
    stop,
    reset,
  };
}
