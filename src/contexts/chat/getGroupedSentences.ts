export type SentenceChunk = {
  id: string; // 🆕 unique identifier
  text: string;
  isParagraphBreak: boolean;
  isDone: boolean;
};

export function splitIntoSentences(text: string): string[] {
  const result: string[] = [];
  const parts = text.split(/(?<=[.!?])\s+/); // rough split

  let buffer = "";
  let openQuotes = 0;

  for (let i = 0; i < parts.length; i++) {
    const segment = parts[i];

    const quoteCount = (segment.match(/["“”]/g) || []).length;
    openQuotes += quoteCount % 2;

    buffer += (buffer ? " " : "") + segment;

    const isLikelyAttribution =
      i + 1 < parts.length &&
      /^[“"']?[A-Z][a-z]+\s(?:[A-Z][a-z]+|[a-z]+)[,.]?$/.test(parts[i + 1]);

    if (openQuotes === 0 && !isLikelyAttribution) {
      result.push(buffer.trim());
      buffer = "";
    }
  }

  if (buffer) result.push(buffer.trim());

  return result;
}

export function getSentenceChunks(fullText: string = ""): SentenceChunk[] {
  const paragraphs = fullText.split(/\n\s*\n/);
  const chunks: SentenceChunk[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    const sentences = splitIntoSentences(para);

    let buffer = "";
    let openQuote = false;

    for (let j = 0; j < sentences.length; j++) {
      const text = sentences[j].trim();
      if (!text || text.length < 2) continue;

      const isAttribution =
        /^[-–—]?\s?[A-Z](?:\.[A-Z])+\.?\s+[A-Z][a-z]+$/.test(text) || // J.R.R. Tolkien
        /^[-–—]?\s?[A-Z][a-zA-Z.]+(?:\s+[A-Z][a-zA-Z.]+)+$/.test(text); // Steve Jobs, etc.

      const isColonIntro = /:\s*$/.test(text) && /[A-Z][a-z]+.*:$/g.test(text);

      if (isAttribution && buffer) {
        const combined = `${buffer.trim()} ${text}`;
        chunks.push({
          id: `${i}-${j}`,
          text: combined,
          isParagraphBreak: j === sentences.length - 1,
          isDone: true,
        });
        buffer = "";
        openQuote = false;
        continue;
      }

      const quoteOpen = (text.match(/["“]/g) || []).length;
      const quoteClose = (text.match(/["”]/g) || []).length;
      openQuote = openQuote || quoteOpen > quoteClose;

      buffer += (buffer ? " " : "") + text;

      if (openQuote && quoteClose < quoteOpen) continue;

      const trimmed = buffer.trim();
      const lastChar = trimmed.slice(-1);
      const secondLastChar = trimmed.slice(-2, -1);

      const endsWithTerminal =
        [".", "!", "?"].includes(lastChar) ||
        (['"', "”"].includes(lastChar) &&
          [".", "!", "?"].includes(secondLastChar));

      const isDone =
        endsWithTerminal ||
        isColonIntro || // Treat colon intros as full sentences
        isAttribution;

      chunks.push({
        id: `${i}-${j}`,
        text: trimmed,
        isParagraphBreak: j === sentences.length - 1,
        isDone,
      });

      buffer = "";
      openQuote = false;
    }

    if (buffer) {
      chunks.push({
        id: `${i}`,
        text: buffer.trim(),
        isParagraphBreak: true,
        isDone: false,
      });
    }
  }

  return chunks;
}
