import { callSupabaseFunction } from "@/services/supabaseFunctionServices";
import { SentenceChunk } from "./getGroupedSentences";

export function stripMarkdown(md: string): string {
  return md
    .replace(/[_*~`>]+/g, "") // remove markdown syntax
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // replace [text](link) with text
    .trim();
}

export function stripEmojis(text: string): string {
  const emojiRegex =
    /[\p{Emoji_Presentation}\p{Emoji}\p{Extended_Pictographic}]/gu;
  return text.replace(emojiRegex, "").trim();
}

const fetchTTSBase64Audio = async (text: string) => {
  const cleaned = stripMarkdown(stripEmojis(text));
  const res = await callSupabaseFunction("tts", { message: cleaned });

  if (!res.ok) {
    console.error("TTS request failed:", await res.text());
    return null;
  }

  const json = await res.json();
  return json.audioContent;
};

async function loadAudio(src: string): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(src);
    audio.preload = "auto";

    audio.addEventListener(
      "canplaythrough",
      () => {
        resolve(audio);
      },
      { once: true }
    );

    audio.addEventListener(
      "error",
      (err) => {
        reject(err);
      },
      { once: true }
    );
  });
}

type AudioCache = Record<number, HTMLAudioElement>;

let audioCache: AudioCache = {};
const playedIndexes = new Set<number>();
const fetchedIndexes = new Set<number>();

let chunkList: SentenceChunk[] = [];
let queue: number[] = [];
let isPlaying = false;
let isRunning = false;
let onPlaybackIndexChange: ((index: number | null) => void) | null = null;

function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export function setPlaybackListener(fn: (index: number | null) => void) {
  onPlaybackIndexChange = fn;
}

export function resetTTS() {
  audioCache = {};
  playedIndexes.clear();
  fetchedIndexes.clear();
  chunkList = [];
  queue = [];
  isPlaying = false;
  isRunning = false;
  onPlaybackIndexChange = null;
}

export async function playTTSQueue(chunks: SentenceChunk[]) {
  console.log("PLAYING TTS QUEUE", chunks);
  chunkList = chunks;

  for (let i = 0; i < chunks.length; i++) {
    if (playedIndexes.has(i)) continue;

    queue.push(i);

    if (!fetchedIndexes.has(i)) {
      fetchedIndexes.add(i);

      try {
        const base64Audio = await fetchTTSBase64Audio(chunks[i].text);
        if (!base64Audio) continue;

        const audio = await loadAudio(`data:audio/wav;base64,${base64Audio}`);
        audioCache[i] = audio;

        if (!isPlaying && i === 0) {
          playNext();
        }
      } catch (err) {
        console.error("TTS fetch/load failed for index", i, err);
      }
    }
  }

  if (!isPlaying && audioCache[0]) {
    playNext();
  }
}

async function playNext() {
  if (isRunning || queue.length === 0) {
    isPlaying = false;
    return;
  }

  isRunning = true;
  isPlaying = true;

  const index = queue.shift()!;
  const chunk = chunkList[index];
  const audio = audioCache[index];

  if (!chunk || playedIndexes.has(index) || !audio) {
    isRunning = false;
    return playNext();
  }

  playedIndexes.add(index);

  console.log("▶️ Playing chunk", index, chunk.text);

  audio.onplay = () => {
    onPlaybackIndexChange?.(index);
  };

  await new Promise<void>((resolve) => {
    audio.onended = () => {
      console.log("⏹️ Finished chunk", index);
      resolve();
    };
    audio.onerror = () => {
      console.warn("❌ Audio error at chunk", index);
      resolve();
    };
    audio.play().catch((err) => {
      console.warn("🚫 Audio.play() failed:", err);
      resolve();
    });
  });

  if (chunk.isParagraphBreak) {
    await wait(350);
  }

  isRunning = false;
  return playNext();
}

export function resetTTSQueue() {
  queue = [];
  isPlaying = false;
  isRunning = false;
  onPlaybackIndexChange?.(null);
}
