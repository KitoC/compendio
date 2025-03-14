import { useAppConfig } from "../../contexts/appConfig/context";
import styled, { css } from "styled-components";
import CompactIcon from "../icons/CompactIcon";
import FullScreenIcon from "../icons/FullScreenIcon";
import clsx from "clsx";
import { IconButton } from "../common/Button";
import CloseXIcon from "../icons/CloseXIcon";
import ChatIcon from "../icons/ChatIcon";

const ChatHeaderContainer = styled.div`
  ${({ theme }) =>
    theme.colors.background && `background-color: ${theme.colors.background};`};
`;

const ChatButton = styled(IconButton)<{ isOpen: boolean }>`
  ${({ isOpen }) => {
    if (!isOpen) {
      return css`
        width: 50px;
        height: 50px;
      `;
    }
  }}
`;

const BrandLogo = styled.img`
  height: 4rem; /* h-16 */
  width: auto;
  border-radius: 0.5rem; /* rounded-lg */
`;

interface ChatHeaderProps {
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  isOpen: boolean;
  toggleChatOpen: () => void;
}

const ChatHeader = ({
  isFullScreen,
  isOpen,
  onToggleFullScreen,
  toggleChatOpen,
}: ChatHeaderProps) => {
  const { chatWidgetConfig } = useAppConfig();

  return (
    <ChatHeaderContainer
      className={clsx("flex justify-between items-center gap-2", {
        "border-b border-slate-100 dark:border-slate-700 p-2 dark:bg-gray-800":
          isOpen,
        "border-none w-full rounded-full shadow-lg bg-transparent": !isOpen,
      })}
    >
      {isOpen && (
        <div className="dark:bg-zinc-900 rounded-lg px-2">
          {chatWidgetConfig?.logo && (
            <BrandLogo src={chatWidgetConfig.logo} alt="Logo" />
          )}
        </div>
      )}

      <div className="flex items-center gap-2 ml-auto">
        {isOpen && (
          <>
            <IconButton
              icon={isFullScreen ? <CompactIcon /> : <FullScreenIcon />}
              onClick={onToggleFullScreen}
            />
            <ChatButton
              variant={isOpen ? undefined : "primary"}
              icon={isOpen ? <CloseXIcon /> : <ChatIcon />}
              onClick={toggleChatOpen}
              isOpen={isOpen}
              className={clsx("", {
                "shadow-none": isOpen,
                "shadow-md": !isOpen,
              })}
            />
          </>
        )}
      </div>
    </ChatHeaderContainer>
  );
};

export default ChatHeader;
