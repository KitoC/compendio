
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import clsx from "clsx";

interface RenderMarkdownProps {
  message: string;
  isUser: boolean;
  isStreamedMessage?: boolean;
}

const INDICATOR_PLACEHOLDER = "{{INDICATOR}}";

const RenderMarkdown: React.FC<RenderMarkdownProps> = ({
  message,
  isUser,
  isStreamedMessage,
}) => {
  const renderChildren = (children: React.ReactNode) => {
    if (!children) {
      return null;
    }
    const childrenArray = React.Children.toArray(children);
    if (childrenArray.length === 0) {
      return null;
    }
    const lastChild = childrenArray[childrenArray.length - 1];
    const hasInsertSpan =
      typeof lastChild === "string" && lastChild === INDICATOR_PLACEHOLDER;
    const childrenString = childrenArray.join("");
    const containsInsertSpan = childrenString.includes(INDICATOR_PLACEHOLDER);

    if (hasInsertSpan || containsInsertSpan) {
      const processedChildren = childrenArray.map((child) => {
        if (typeof child === "string") {
          return child.replace(INDICATOR_PLACEHOLDER, "");
        }
        return child;
      });

      return (
        <>
          {processedChildren} <span className="w-2 h-2 bg-current rounded-full inline-block animate-pulse" />
        </>
      );
    }

    return <>{children}</>;
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={clsx("prose prose-sm max-w-none dark:prose-invert", {
        "text-primary-foreground": isUser,
        "streamed-message": isStreamedMessage,
      })}
      components={{
        p: ({ children }) => {
          return <p className="m-0">{renderChildren(children)}</p>;
        },
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx("underline", {
              "text-primary-foreground": isUser,
              "text-primary": !isUser,
            })}
          >
            {renderChildren(children)}
          </a>
        ),
        code: ({ className, children, node, ...props }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code
                className={clsx("px-2 py-0.5 rounded text-sm", {
                  "bg-primary-foreground/20 text-primary-foreground": isUser,
                  "bg-background text-foreground dark:bg-gray-800": !isUser,
                })}
              >
                {renderChildren(children)}
              </code>
            );
          }
          return (
            <pre
              className={clsx("p-4 rounded-md my-2 overflow-auto", {
                "bg-primary-foreground/20": isUser,
                "bg-muted dark:bg-gray-800": !isUser,
              })}
            >
              <code className={`language-${className} text-sm`}>
                {renderChildren(children)}
              </code>
            </pre>
          );
        },
        ul: ({ children }) => (
          <ul
            className="list-disc pl-4 my-2"
          >
            {renderChildren(children)}
          </ul>
        ),
        ol: ({ children }) => (
          <ol
            className="list-decimal pl-4 my-2"
          >
            {renderChildren(children)}
          </ol>
        ),
        li: ({ children }) => (
          <li className="mb-1">
            {renderChildren(children)}
          </li>
        ),
        blockquote: ({ children }) => (
          <blockquote
            className={clsx("border-l-4 pl-3 my-2", {
              "border-primary-foreground/50 bg-primary-dark": isUser,
              "border-muted-foreground bg-muted dark:bg-gray-800": !isUser,
            })}
          >
            {renderChildren(children)}
          </blockquote>
        ),
        h1: ({ children }) => (
          <h1
            className="text-xl font-bold my-2"
          >
            {renderChildren(children)}
          </h1>
        ),
        h2: ({ children }) => (
          <h2
            className="text-lg font-bold my-2"
          >
            {renderChildren(children)}
          </h2>
        ),
        h3: ({ children }) => (
          <h3
            className="text-base font-bold my-2"
          >
            {renderChildren(children)}
          </h3>
        ),
      }}
    >
      {isStreamedMessage ? message + INDICATOR_PLACEHOLDER : message}
    </ReactMarkdown>
  );
};

export default RenderMarkdown;
