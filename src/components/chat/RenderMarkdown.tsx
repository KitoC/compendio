import { FC, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useIsMobile } from "@/hooks/use-mobile";
import { getSentenceChunks } from "@/contexts/chat/getGroupedSentences";
import classNames from "clsx"; // optional utility
import { useTTS } from "@/contexts/TTSProvider";

interface RenderMarkdownProps {
  message: string;
  isUser: boolean;
  isStreamedMessage?: boolean;
  className?: string;
}

export function balanceMarkdown(md: string): string {
  const pairs: Record<string, string> = {
    "**": "**",
    "*": "*",
    __: "__",
    _: "_",
    "`": "`",
    "```": "```",
  };

  for (const opener of Object.keys(pairs)) {
    const count = (md.match(new RegExp(`\\${opener}`, "g")) || []).length;
    if (count % 2 !== 0) {
      md += pairs[opener]; // close it
    }
  }

  return md;
}

const highlightRegex = /{{([^}]+)}}/g;

const replaceHighlightedText = (text: string) => {
  if (!text.includes("{{")) return text;

  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  // Reset regex state
  highlightRegex.lastIndex = 0;

  while ((match = highlightRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add the highlighted text
    parts.push(<span className="text-primary">{match[1]}</span>);

    lastIndex = match.index + match[0].length;
  }

  // Add any remaining text after the last match
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length === 1 ? parts[0] : parts;
};

const RenderMarkdown: FC<RenderMarkdownProps> = ({
  message,
  isUser,
  isStreamedMessage,
  className,
}) => {
  const isMobile = useIsMobile();
  const [chunks, setChunks] = useState<
    { id: string; text: string; isParagraphBreak: boolean }[]
  >([]);
  const { currentIndex } = useTTS();

  useEffect(() => {
    let active = true;

    const result = getSentenceChunks(message);

    setChunks(result);

    return () => {
      active = false;
    };
  }, [message]);

  const textWithHighlightedChunks = chunks
    .map((chunk, i) => {
      const highlighted = i === currentIndex;

      const highlightedText = highlighted ? `{{${chunk.text}}}` : chunk.text;
      if (chunk.isParagraphBreak) {
        return `${highlightedText}\n\n`;
      }

      return highlightedText;
    })
    .join(" ");

  console.log(textWithHighlightedChunks);

  return (
    <div
      className={classNames(
        "prose-sm max-w-none dark:prose-invert safari-text-rendering-fix",
        isStreamedMessage && "streamed-message",
        isMobile && "text-sm",
        className
      )}
      style={{
        WebkitTextSizeAdjust: "100%",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => {
            if (typeof children === "string") {
              return (
                <p className="last:mb-0 mb-2">
                  {replaceHighlightedText(children)}
                </p>
              );
            }

            return <p className="not:last:mb-2">{children}</p>;
          },
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`underline ${
                isUser ? "text-primary-foreground" : "text-primary"
              }`}
            >
              {children}
            </a>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className={`px-1 py-0.5 rounded text-sm ${
                    isUser
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  } safari-inline-code-fix`}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre
                className={`p-4 rounded-md my-2 overflow-auto ${
                  isMobile ? "text-xs" : ""
                } ${
                  isUser ? "bg-primary-foreground/20" : "bg-muted"
                } safari-code-block-fix`}
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <code className={className}>{children}</code>
              </pre>
            );
          },
          ul: ({ children }) => (
            <ul className="list-disc pl-4 my-2 safari-list-fix">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 my-2 safari-list-fix">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="mb-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote
              className={`border-l-4 pl-3 my-2 ${
                isUser
                  ? "border-primary-foreground/50 bg-primary-foreground/10"
                  : "border-muted bg-muted/50"
              } safari-blockquote-fix`}
            >
              {children}
            </blockquote>
          ),
          h1: ({ children }) => (
            <h1 className="text-xl font-bold my-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold my-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-bold my-2">{children}</h3>
          ),
        }}
      >
        {message}
      </ReactMarkdown>

      {isStreamedMessage && (
        <span className="inline-block h-2 w-2 rounded-full bg-current animate-pulse ml-1" />
      )}
    </div>
  );
};

export default RenderMarkdown;
