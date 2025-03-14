import React from "react";
import "../../styles/main.css";
import styled, { css } from "styled-components";
import ChatMessages from "../chat/ChatMessages";
import ChatFooter from "../chat/ChatFooter";
import withConfigConnectedProviders from "../../provider-recipes-hocs/withConfigConnectedProviders";
import ChatHeader from "../chat/ChatHeader";
import clsx from "clsx";
import { IconButton } from "../common/Button";
import ChatIcon from "../icons/ChatIcon";
import { useChatWidgetUI } from "../../contexts/chatWidgetUI/context";
import { ChatWidgetUIContextType } from "../../contexts/chatWidgetUI/context";

const StyledOverlay = styled.div<{ isFullScreen: boolean; isOpen: boolean }>`
  position: fixed;
  transition: all 0.3s ease-out;
  right: 0;
  bottom: 0;
  top: 0;
  left: 0;

  height: 100vh;
  width: 100vw;

  ${({ isFullScreen, isOpen }) => {
    if (isFullScreen && isOpen) {
      return css`
        background-color: rgba(0, 0, 0, 0.2);
      `;
    }

    if (!isOpen) {
      return css`
        pointer-events: none;
      `;
    }
  }}
`;

const Container = styled.div<{
  isOpen: boolean;
  isFullScreen: boolean;
  position: ChatWidgetUIContextType["position"];
}>`
  display: flex;
  flex-direction: column;
  height: 100%;

  ${({ position, isOpen }) => {
    if (position === "bottom-right") {
      return css`
        bottom: 25px;
        right: 25px;
        transform-origin: bottom right;
      `;
    }

    if (position === "bottom-left") {
      return css`
        bottom: 25px;
        left: 25px;
        transform-origin: bottom left;
      `;
    }

    if (position === "top-right") {
      return css`
        top: 25px;
        right: 25px;
        transform-origin: top right;
      `;
    }

    if (position === "top-left") {
      return css`
        top: 25px;
        left: 25px;
        transform-origin: top left;
      `;
    }

    if (position === "left") {
      return css`
        left: 25px;
        bottom: 50%;
        transform-origin: center left;

        ${isOpen &&
        css`
          transform: translateY(50%);
        `}
      `;
    }

    if (position === "right") {
      return css`
        right: 25px;
        bottom: 50%;
        transform-origin: center right;

        ${isOpen &&
        css`
          transform: translateY(50%);
        `}
      `;
    }
  }}
  position: absolute;

  transition: all 0.3s ease-out;

  pointer-events: all;

  ${({ isOpen }) => {
    if (isOpen) {
      return css`
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
      `;
    }

    return css`
      background-color: transparent;
    `;
  }}

  ${({ isOpen, isFullScreen }) => {
    if (!isOpen) {
      return css`
        --size: calc(56px);
        height: var(--size);
        width: var(--size);
        max-height: var(--size);
        max-width: var(--size);
      `;
    }
    if (!isFullScreen) {
      return css`
        height: 600px;
        width: 400px;
        max-height: 600px;
        max-width: 400px;
      `;
    }
    return css`
      height: calc(100vh - 50px);
      max-height: calc(100vh - 50px);
      max-width: 72rem;
      width: 100%;
    `;
  }}
`;

const ChatButton = styled(IconButton)<{ isOpen: boolean }>`
  position: absolute;
  width: 50px;
  height: 50px;
  transition-delay: 1s;
  transition: opacity 0.3s ease-out;

  ${({ isOpen }) => {
    if (isOpen) {
      return css`
        pointer-events: none;
      `;
    }
  }}

  &.bottom-left {
    bottom: 0;
    left: 0;
  }
  &.bottom-right {
    bottom: 0;
    right: 0;
  }
  &.top-left {
    top: 0;
    left: 0;
  }
  &.top-right {
    top: 0;
    right: 0;
  }
  &.left {
    left: 0;
    bottom: 50%;
    transform-origin: center left;
  }

  &.right {
    right: 0;
    bottom: 50%;
    transform-origin: center right;
  }
`;

const ChatWidget: React.FC = () => {
  const {
    isOpen,
    isFullScreen,
    toggleFullScreen,
    handleClose,
    position,
    toggleChatOpen,
  } = useChatWidgetUI();

  return (
    <StyledOverlay
      className="skybrook-chat-widget"
      isFullScreen={isFullScreen}
      isOpen={isOpen}
      onClick={handleClose}
    >
      <Container
        position={position}
        isOpen={isOpen}
        isFullScreen={isFullScreen}
        onClick={(e) => e.stopPropagation()}
        className={clsx("bg-white dark:bg-gray-800 rounded-lg", {
          "p-2": !isOpen,
          "border border-gray-200 dark:border-gray-700": isOpen,
        })}
      >
        <ChatHeader
          isFullScreen={isFullScreen}
          isOpen={isOpen}
          onToggleFullScreen={toggleFullScreen}
          toggleChatOpen={toggleChatOpen}
        />

        {isOpen && <ChatMessages />}
        {isOpen && <ChatFooter />}

        {/* <Tooltip content="After a quote? Let's chat!" delay={1000}> */}
        <ChatButton
          variant={isOpen ? undefined : "primary"}
          icon={<ChatIcon />}
          onClick={toggleChatOpen}
          isOpen={isOpen}
          className={clsx("shadow-md", position, {
            "opacity-0": isOpen,
            open: isOpen,
          })}
        />
        {/* </Tooltip> */}
      </Container>
    </StyledOverlay>
  );
};

const ConnectedChatWidget = withConfigConnectedProviders(ChatWidget);

export default ConnectedChatWidget;
