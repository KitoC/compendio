
import { FC } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useIsMobile } from "@/hooks/use-mobile";

interface RenderMarkdownProps {
  message: string;
  isUser: boolean;
  isStreamedMessage?: boolean;
}

const RenderMarkdown: FC<RenderMarkdownProps> = ({
  message,
  isUser,
  isStreamedMessage,
}) => {
  const isMobile = useIsMobile();
  
  // Handle case when message is not a string
  if (typeof message !== "string") {
    console.warn("RenderMarkdown received non-string message:", message);
    return null;
  }

  return (
    <div 
      className={`prose-sm max-w-none dark:prose-invert ${
        isStreamedMessage ? "streamed-message" : ""
      } ${isMobile ? "text-sm" : ""} safari-text-rendering-fix`}
      style={{
        // Apply Safari-specific style fixes
        WebkitTextSizeAdjust: "100%",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => {
            return <p className="my-1 break-words">{children}</p>;
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
                  isUser
                    ? "bg-primary-foreground/20"
                    : "bg-muted"
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
            <ol className="list-decimal pl-4 my-2 safari-list-fix">{children}</ol>
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
