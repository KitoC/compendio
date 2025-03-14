import React, { useState, useEffect, useRef, ReactNode } from "react";
import styled from "styled-components";
import {
  useFloating,
  offset,
  flip,
  shift,
  arrow,
  autoUpdate,
} from "@floating-ui/react";
import clsx from "clsx";

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  delay?: number;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
  onClose?: () => void;
}

const TooltipContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const TooltipContent = styled.div`
  position: absolute;
  background-color: white;
  color: #333;
  padding: 0.5rem;
  border-radius: 0.25rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 50;
  max-width: 300px;
  font-size: 0.875rem;
  border: 1px solid rgba(0, 0, 0, 0.05);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 0;
  left: -25px;
  background: gray;
  cursor: pointer;
  font-size: 0.75rem;
  color: white;
  padding: 0;
  line-height: 1;
  border: 1px solid white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);

  &:hover {
    background: black;
  }
`;

const ArrowElement = styled.div`
  position: absolute;
  width: 8px;
  height: 8px;
  background: white;
  transform: rotate(45deg);
  border: 1px solid rgba(0, 0, 0, 0.05);
  z-index: -1;
`;

const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  delay = 500,
  position = "left",
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const arrowRef = useRef<HTMLDivElement>(null);

  const placement =
    position === "top"
      ? "top"
      : position === "bottom"
      ? "bottom"
      : position === "left"
      ? "left"
      : "right";

  const { x, y, strategy, refs, middlewareData, update } = useFloating({
    placement,
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 5 }),
      arrow({ element: arrowRef }),
    ],
  });

  useEffect(() => {
    if (!refs.reference.current || !refs.floating.current) return;

    return autoUpdate(refs.reference.current, refs.floating.current, update);
  }, [refs.reference, refs.floating, update]);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [delay]);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const arrowX = middlewareData.arrow?.x;
  const arrowY = middlewareData.arrow?.y;
  const staticSide = {
    top: "bottom",
    right: "left",
    bottom: "top",
    left: "right",
  }[placement.split("-")[0]];

  return (
    <>
      {React.cloneElement(React.Children.only(children) as React.ReactElement, {
        ref: refs.reference,
      })}
      {isOpen && (
        <TooltipContent
          ref={refs.floating as React.RefObject<HTMLDivElement>}
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
            width: "max-content",
          }}
          className={clsx("tooltip-content")}
        >
          <ArrowElement
            ref={arrowRef}
            style={{
              left: arrowX != null ? `${arrowX}px` : "",
              top: arrowY != null ? `${arrowY}px` : "",
              [staticSide as string]: "-4px",
            }}
          />
          {content}
          <CloseButton onClick={handleClose} aria-label="Close tooltip">
            ✕
          </CloseButton>
        </TooltipContent>
      )}
    </>
  );
};

export default Tooltip;
