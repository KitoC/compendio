import { forwardRef, useEffect, TextareaHTMLAttributes, useRef } from "react";

import styled from "styled-components";

interface AutoExpandingTextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxRows?: number;
  disabled?: boolean;
}

const StyledTextArea = styled.textarea<{ maxHeight?: string }>`
  width: 100%;
  min-height: 24px;
  padding: 12px;
  border: none;
  resize: none;
  outline: none;
  max-height: ${({ maxHeight }) => maxHeight || "150px"};
  overflow-y: auto;

  // Preserve existing styles from StyledInput
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;

  &:disabled {
    background-color: transparent;
  }
`;

const AutoExpandingTextArea = forwardRef<
  HTMLTextAreaElement,
  AutoExpandingTextAreaProps
>(({ value, onChange, maxRows = 5, ...props }, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";

    // Calculate new height
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
    const maxHeight = lineHeight * maxRows;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);

    textarea.style.height = `${newHeight}px`;
  }, [value, maxRows]);

  return (
    <StyledTextArea
      className="bg-white dark:bg-gray-700 dark:text-white p-0"
      ref={(element) => {
        textareaRef.current = element;
        if (typeof ref === "function") {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      }}
      value={value}
      onChange={onChange}
      maxHeight={`${
        parseInt(getComputedStyle(document.documentElement).lineHeight) *
        maxRows
      }px`}
      rows={1}
      {...props}
    />
  );
});

AutoExpandingTextArea.displayName = "AutoExpandingTextArea";

export default AutoExpandingTextArea;
