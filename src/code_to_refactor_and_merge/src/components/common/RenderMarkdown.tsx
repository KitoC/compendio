
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styled from "styled-components";
import { ThemeConfig } from "../../config/theme.config";
import clsx from "clsx";

const StyledLink = styled.a<{ isUser: boolean; theme: ThemeConfig }>`
  text-decoration: underline;
  color: ${(props) =>
    props.isUser ? props.theme.chat.userTextColor : props.theme.colors.primary};
`;

const InlineCode = styled.code<{ isUser: boolean }>`
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  ${(props) =>
    props.isUser
      ? `
    background-color: rgba(79, 70, 229, 0.5);
    color: white;
  `
      : `
    background-color: rgba(255, 255, 255, 0.5);
    color: rgb(31, 41, 55);
  `}
  backdrop-filter: blur(4px);
`;

const CodeBlock = styled.pre<{ isUser: boolean }>`
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 0.5rem 0;
  overflow: auto;
  ${(props) =>
    props.isUser
      ? `
    background-color: rgba(79, 70, 229, 0.5);
  `
      : `
    background-color: rgba(255, 255, 255, 0.5);
  `}
  backdrop-filter: blur(4px);
`;

const StyledBlockquote = styled.blockquote<{ isUser: boolean }>`
  border-left-width: 4px;
  padding-left: 0.75rem;
  margin: 0.5rem 0;
  ${(props) =>
    props.isUser
      ? `
    border-color: rgb(129, 140, 248);
    background-color: rgb(67, 56, 202);
  `
      : `
    border-color: rgb(209, 213, 219);
    background-color: rgb(249, 250, 251);
  `}
`;

const AiIndicator = styled.span`
  width: 10px;
  height: 10px;
  background-color: #000;
  border-radius: 50%;
  content: "";
  display: inline-block;
`;

interface MarkdownProps {
  className?: string;
}

const INDICATOR_PLACEHOLDER = "{{INDICATOR}}";

interface RenderMarkdownProps {
  message: string;
  isUser: boolean;
  theme: ThemeConfig;
  isStreamedMessage?: boolean;
}

const RenderMarkdown = ({
  message,
  isUser,
  theme,
  isStreamedMessage,
}: RenderMarkdownProps) => {
  const renderChildren = (children: React.ReactNode) => {
    // Handle null or undefined children
    if (!children) {
      return null;
    }

    // Convert to array if it's not already
    const childrenArray = React.Children.toArray(children);

    // Check if we have any children
    if (childrenArray.length === 0) {
      return null;
    }

    // Check if the last child contains the insert_span marker
    const lastChild = childrenArray[childrenArray.length - 1];

    // Handle different types of children
    const hasInsertSpan =
      typeof lastChild === "string" && lastChild === INDICATOR_PLACEHOLDER;

    // Check if any child contains the insert_span marker
    const childrenString = childrenArray.join("");
    const containsInsertSpan = childrenString.includes(INDICATOR_PLACEHOLDER);

    if (hasInsertSpan || containsInsertSpan) {
      // Process the children to remove the marker
      const processedChildren = childrenArray.map((child) => {
        if (typeof child === "string") {
          return child.replace(INDICATOR_PLACEHOLDER, "");
        }
        return child;
      });

      return (
        <>
          {processedChildren} <AiIndicator className="animate-pulse" />
        </>
      );
    }

    return <>{children}</>;
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={clsx("prose prose-sm max-w-none dark:text-white", {
        "streamed-message": isStreamedMessage,
      })}
      components={{
        p: ({ children }) => {
          return <p style={{ margin: 0 }}>{renderChildren(children)}</p>;
        },
        a: ({ href, children }) => (
          <StyledLink
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            isUser={isUser}
            theme={theme}
          >
            {renderChildren(children)}
          </StyledLink>
        ),
        code: ({ className, children, node, ...props }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <InlineCode isUser={isUser}>
                {renderChildren(children)}
              </InlineCode>
            );
          }
          return (
            <CodeBlock isUser={isUser}>
              <code className={`language-${className} text-sm`}>
                {renderChildren(children)}
              </code>
            </CodeBlock>
          );
        },
        ul: ({ children }) => (
          <ul
            style={{
              listStyleType: "disc",
              paddingLeft: "1rem",
              margin: "0.5rem 0",
            }}
          >
            {renderChildren(children)}
          </ul>
        ),
        ol: ({ children }) => (
          <ol
            style={{
              listStyleType: "decimal",
              paddingLeft: "1rem",
              margin: "0.5rem 0",
            }}
          >
            {renderChildren(children)}
          </ol>
        ),
        li: ({ children }) => (
          <li style={{ marginBottom: "0.25rem" }}>
            {renderChildren(children)}
          </li>
        ),
        blockquote: ({ children }) => (
          <StyledBlockquote isUser={isUser}>
            {renderChildren(children)}
          </StyledBlockquote>
        ),
        h1: ({ children }) => (
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              margin: "0.5rem 0",
            }}
          >
            {renderChildren(children)}
          </h1>
        ),
        h2: ({ children }) => (
          <h2
            style={{
              fontSize: "1.125rem",
              fontWeight: "bold",
              margin: "0.5rem 0",
            }}
          >
            {renderChildren(children)}
          </h2>
        ),
        h3: ({ children }) => (
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: "bold",
              margin: "0.5rem 0",
            }}
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
